'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Input from '@/components/ui/input';
import Tabs from '@/components/ui/tabs';
import Modal from '@/components/ui/modal';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
  tags: string[];
}

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    content: '',
    tags: '',
  });

  const knowledgeItems: KnowledgeItem[] = [
    {
      id: '1',
      title: 'Product Launch Strategy',
      category: 'Product',
      content: 'Comprehensive strategy for launching new product features...',
      createdAt: 'Apr 20, 2025',
      tags: ['product', 'strategy', 'launch'],
    },
    {
      id: '2',
      title: 'Company Onboarding Process',
      category: 'HR',
      content: 'Step-by-step guide for onboarding new team members...',
      createdAt: 'Apr 15, 2025',
      tags: ['onboarding', 'hr', 'process'],
    },
    {
      id: '3',
      title: 'Customer Support Best Practices',
      category: 'Support',
      content: 'Guidelines for providing excellent customer support...',
      createdAt: 'Apr 10, 2025',
      tags: ['support', 'customer', 'best-practices'],
    },
    {
      id: '4',
      title: 'Code Review Guidelines',
      category: 'Engineering',
      content: 'Standards and best practices for code reviews...',
      createdAt: 'Apr 8, 2025',
      tags: ['engineering', 'code', 'review'],
    },
  ];

  const categories = ['All', 'Product', 'Engineering', 'HR', 'Support', 'Marketing'];

  const filteredItems = knowledgeItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle creation logic here
    setFormData({ title: '', category: 'general', content: '', tags: '' });
    setShowCreateModal(false);
  };

  return (
    <>
      <Header
        title="Knowledge Base"
        subtitle="Company knowledge and best practices"
        rightAction={
          <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
            + New Article
          </Button>
        }
      />

      <main className="p-8">
        {/* Search */}
        <Card className="mb-8">
          <Input
            placeholder="Search knowledge base..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[var(--color-background-dark)]"
          />
        </Card>

        {/* Categories */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'primary' : 'secondary'}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Knowledge Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} hover interactive>
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex-1">
                    {item.title}
                  </h3>
                  <Badge variant="primary" size="sm">
                    {item.category}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {item.createdAt}
                </p>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
                {item.content}
              </p>

              <div className="flex gap-1 flex-wrap mb-4">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="info" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="primary" size="sm" fullWidth>
                  Read
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              No articles found
            </p>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Try adjusting your search or create a new article.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create New Article
            </Button>
          </Card>
        )}
      </main>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Article"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateItem}>
              Create Article
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <Input
            label="Article Title"
            placeholder="Enter article title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="label">Category</label>
            <select
              className="input-field"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="general">General</option>
              <option value="product">Product</option>
              <option value="engineering">Engineering</option>
              <option value="hr">HR</option>
              <option value="support">Support</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>

          <div>
            <label className="label">Content</label>
            <textarea
              className="input-field resize-none"
              rows={6}
              placeholder="Write your article content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <Input
            label="Tags"
            placeholder="tag1, tag2, tag3"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            helperText="Separate tags with commas"
          />
        </form>
      </Modal>
    </>
  );
}