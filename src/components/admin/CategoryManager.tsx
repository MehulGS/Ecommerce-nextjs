'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Power, Loader2, X, Check } from 'lucide-react';
import { slugify } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  initialCategories: Category[];
}

export default function CategoryManager({ initialCategories }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setSortOrder('0');
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (cat: Category) => {
    setEditId(cat._id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? '');
    setSortOrder(cat.sortOrder.toString());
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading('save');
    try {
      const url = editId ? `/api/admin/categories/${editId}` : '/api/admin/categories';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug || slugify(name),
          description: description.trim() || undefined,
          sortOrder: parseInt(sortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editId ? 'Category updated!' : 'Category created!');
        router.refresh();
        resetForm();
        // Update local state
        if (editId) {
          setCategories((prev) => prev.map((c) => c._id === editId ? data.category : c));
        } else {
          setCategories((prev) => [...prev, data.category]);
        }
      } else {
        toast.error(data.error ?? 'Failed to save');
      }
    } catch {
      toast.error('Error saving category');
    } finally {
      setLoading(null);
    }
  };

  const toggleActive = async (cat: Category) => {
    setLoading(cat._id);
    try {
      const res = await fetch(`/api/admin/categories/${cat._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (res.ok) {
        setCategories((prev) => prev.map((c) => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
        toast.success(cat.isActive ? 'Category deactivated' : 'Category activated');
      }
    } catch {
      toast.error('Error updating category');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-soft border border-blush-100 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-plum">{editId ? 'Edit Category' : 'Add Category'}</h3>
            <button type="button" onClick={resetForm} className="text-plum/40 hover:text-plum">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (!editId) setSlug(slugify(e.target.value)); }}
                className="input-field"
                placeholder="Korean Earrings"
                required
              />
            </div>
            <div>
              <label className="label">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="korean-earrings"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading === 'save'} className="btn-primary py-2.5 flex-1">
              {loading === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editId ? 'Update' : 'Create'} Category
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary py-2.5">Cancel</button>
          </div>
        </form>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-soft border border-blush-50 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-plum/40">
            No categories yet. Add your first category!
          </div>
        ) : (
          <div className="divide-y divide-blush-50">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between px-5 py-4 hover:bg-blush-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-plum">{cat.name}</p>
                    <p className="text-xs text-plum/40 font-mono">{cat.slug}</p>
                    {cat.description && <p className="text-xs text-plum/50 mt-0.5">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => startEdit(cat)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blush-100 text-plum/50 hover:text-plum"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(cat)}
                    disabled={loading === cat._id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blush-100 text-plum/50 hover:text-plum"
                    title={cat.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {loading === cat._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Power className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
