'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2, Upload, Loader2, X } from 'lucide-react';
import { slugify } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  url: string;
  alt?: string;
  sortOrder: number;
  /** True while the file is being uploaded to the server */
  uploading?: boolean;
}

interface Spec {
  key: string;
  value: string;
}

interface ProductData {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  images?: Array<{ url: string; alt?: string; sortOrder: number }>;
  category?: string;
  sku?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  isActive?: boolean;
  isOutOfStock?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  tags?: string[];
  specifications?: Spec[];
  weight?: number;
}

interface ProductFormProps {
  categories: Category[];
  product?: ProductData;
}

export default function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '');
  const [categoryId, setCategoryId] = useState(product?.category ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [price, setPrice] = useState(product?.price?.toString() ?? '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice?.toString() ?? '');
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isOutOfStock, setIsOutOfStock] = useState(product?.isOutOfStock ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isBestseller, setIsBestseller] = useState(product?.isBestseller ?? false);
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [specs, setSpecs] = useState<Spec[]>(product?.specifications ?? []);
  const [weight, setWeight] = useState(product?.weight?.toString() ?? '');
  const [images, setImages] = useState<ProductImage[]>(
    product?.images?.map((img) => ({ ...img })) ?? []
  );

  const handleNameChange = (val: string) => {
    setName(val);
    if (!product?._id) {
      setSlug(slugify(val));
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[i][field] = val;
    setSpecs(updated);
  };
  const removeSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));

  /** Upload a single file to the server and return the public URL. */
  const uploadToServer = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'products');

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Upload failed (${res.status})`);
    }

    const data = await res.json();
    return data.url as string;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    for (const file of files) {
      // Basic client-side guard (server will re-validate fully)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5 MB)`);
        continue;
      }

      // Optimistic placeholder using object URL
      const previewUrl = URL.createObjectURL(file);
      const sortOrder = images.length;
      const placeholder: ProductImage = { url: previewUrl, sortOrder, uploading: true };
      setImages((prev) => [...prev, placeholder]);

      try {
        const serverUrl = await uploadToServer(file);
        if (!serverUrl) throw new Error('No URL returned');

        // Replace placeholder with real server URL
        setImages((prev) =>
          prev.map((img) =>
            img.url === previewUrl
              ? { url: serverUrl, sortOrder: img.sortOrder, uploading: false }
              : img
          )
        );
        // Release the temporary blob URL
        URL.revokeObjectURL(previewUrl);
        toast.success('Image uploaded');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
        // Remove placeholder
        setImages((prev) => prev.filter((img) => img.url !== previewUrl));
        URL.revokeObjectURL(previewUrl);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = async (index: number) => {
    const img = images[index];
    // Only attempt server deletion for server-hosted images
    if (img.url.startsWith('/uploads/')) {
      try {
        await fetch('/api/admin/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: img.url, category: 'products' }),
        });
      } catch {
        // Non-fatal — the file might not exist yet or the request failed
      }
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !categoryId || !sku || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (images.some((img) => img.uploading)) {
      toast.error('Please wait for all images to finish uploading');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name,
        slug,
        description,
        shortDescription: shortDescription || undefined,
        images: images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          sortOrder: i,
        })),
        category: categoryId,
        sku: sku.toUpperCase(),
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        stock: parseInt(stock) || 0,
        isActive,
        isOutOfStock,
        isFeatured,
        isBestseller,
        tags: tags.filter(Boolean),
        specifications: specs.filter((s) => s.key && s.value),
        weight: weight ? parseFloat(weight) : undefined,
      };

      const url = product?._id
        ? `/api/admin/products/${product._id}`
        : '/api/admin/products';
      const method = product?._id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save product');
        return;
      }

      toast.success(product?._id ? 'Product updated!' : 'Product created!');
      router.push('/admin/products');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
            <h2 className="font-semibold text-plum">Basic Information</h2>

            <div>
              <label className="label">Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input-field"
                placeholder="e.g. Cute Korean Star Earrings"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Slug (URL)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder="cute-korean-star-earrings"
                  required
                />
              </div>
              <div>
                <label className="label">SKU *</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="input-field font-mono"
                  placeholder="CL-EAR-001"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Short Description</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="input-field"
                placeholder="Brief one-line description"
                maxLength={200}
              />
            </div>

            <div>
              <label className="label">Full Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="Detailed product description..."
                required
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
            <h2 className="font-semibold text-plum">Product Images</h2>
            <p className="text-xs text-plum/50">
              Upload multiple images (JPEG, PNG, WebP · max 5 MB each). First image is the main display image.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden bg-blush-50 border border-blush-100"
                >
                  <Image
                    src={img.url}
                    alt={`Product image ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="150px"
                    // Unoptimised for blob: URLs (previews while uploading)
                    unoptimized={img.url.startsWith('blob:')}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-plum" />
                    </div>
                  )}
                  {!img.uploading && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {i === 0 && (
                    <div className="absolute bottom-1 left-1 bg-plum text-ivory text-xs px-1.5 py-0.5 rounded-full">
                      Main
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-blush-200 hover:border-blush-400 flex flex-col items-center justify-center gap-2 bg-blush-50 hover:bg-blush-100 transition-colors"
                aria-label="Add image"
              >
                <Upload className="w-6 h-6 text-blush-300" />
                <span className="text-xs text-plum/50">Add Image</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-plum">Specifications</h2>
              <button type="button" onClick={addSpec} className="btn-ghost text-sm py-1.5">
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
            {specs.length === 0 ? (
              <p className="text-plum/40 text-sm">No specifications added. Click &quot;Add Row&quot; to add one.</p>
            ) : (
              <div className="space-y-2">
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => updateSpec(i, 'key', e.target.value)}
                      className="input-field py-2 flex-1"
                      placeholder="Material"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      className="input-field py-2 flex-1"
                      placeholder="Sterling Silver"
                    />
                    <button type="button" onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
            <h2 className="font-semibold text-plum">Tags</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input-field py-2 flex-1"
                placeholder="birthday, gift, korean, earring..."
              />
              <button type="button" onClick={addTag} className="btn-secondary py-2 px-4">
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-blush-100 rounded-full text-sm text-plum"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-plum/40 hover:text-red-500"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
            <h2 className="font-semibold text-plum">Pricing</h2>
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                placeholder="299"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="label">Original Price (₹)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="input-field"
                placeholder="499 (for strikethrough)"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
            <h2 className="font-semibold text-plum">Inventory</h2>
            <div>
              <label className="label">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="input-field"
                min="0"
                required
              />
            </div>
            <div>
              <label className="label">Weight (grams)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-field"
                min="0"
                placeholder="50"
              />
            </div>
          </div>

          {/* Status Flags */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
            <h2 className="font-semibold text-plum">Status &amp; Flags</h2>
            {(
              [
                { label: 'Active (visible to customers)', state: isActive, set: setIsActive },
                { label: 'Out of Stock (disable purchase)', state: isOutOfStock, set: setIsOutOfStock },
                { label: 'Featured (show in featured section)', state: isFeatured, set: setIsFeatured },
                { label: 'Bestseller', state: isBestseller, set: setIsBestseller },
              ] as const
            ).map((flag) => (
              <label key={flag.label} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-plum/70">{flag.label}</span>
                <div
                  role="switch"
                  aria-checked={flag.state}
                  onClick={() => flag.set(!flag.state)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    flag.state ? 'bg-plum' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      flag.state ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-4">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : product?._id ? (
              'Update Product'
            ) : (
              'Create Product'
            )}
          </button>

          {product?._id && (
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
