import { useState } from 'react';
import { FolderPlus, Plus, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { haptics } from '@/lib/haptics';
import { useVectorStore } from '@/store/useVectorStore';

export function Templates() {
  const { templates, addTemplate, removeTemplate, applyTemplate, tasks } = useVectorStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const handleCreateFromCurrent = () => {
    if (!formData.name.trim() || selectedTasks.length === 0) return;

    const tasksToSave = tasks
      .filter(t => selectedTasks.includes(t.id))
      .map(({ id, completed, ...rest }) => rest);

    addTemplate(formData.name, formData.description, tasksToSave);
    haptics.success();
    setFormData({ name: '', description: '' });
    setSelectedTasks([]);
    setShowAddForm(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight mb-1">Task Templates</h2>
          <p className="text-xs text-muted-foreground">Save and reuse task sets</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Routine"
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Select Tasks to Include
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 border border-border rounded p-2 bg-background">
                  {tasks.filter(t => !t.isSystem).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No tasks available. Create some tasks first.
                    </p>
                  ) : (
                    tasks
                      .filter(t => !t.isSystem)
                      .map((task) => (
                        <label
                          key={task.id}
                          className="flex items-center gap-2 p-1 hover:bg-secondary rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTasks([...selectedTasks, task.id]);
                              } else {
                                setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-xs">{task.text}</span>
                        </label>
                      ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateFromCurrent}
                  disabled={!formData.name.trim() || selectedTasks.length === 0}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Template
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', description: '' });
                    setSelectedTasks([]);
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No templates yet. Create one from your current tasks!</p>
          </div>
        ) : (
          templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">{template.name}</h3>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {template.tasks.length} task{template.tasks.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      applyTemplate(template.id);
                      haptics.success();
                    }}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Apply template"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      removeTemplate(template.id);
                      haptics.light();
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                    title="Delete template"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
