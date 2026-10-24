import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { questionService } from '../../services/questionService';
import { Question, QuestionCategory, PublicationStatus, VerificationStatus } from '../../types';
import {
  ShieldAlert,
  Search,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Layers,
  Sparkles,
  Database,
  Eye,
  Archive,
  Save,
  X
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Editing state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Batch Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreview, setImportPreview] = useState<{ total: number; valid: boolean; items: Question[] } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  useEffect(() => {
    loadAllQuestions();
  }, []);

  const loadAllQuestions = async () => {
    setLoading(true);
    try {
      const items = await questionService.getAllQuestions();
      setQuestions(items);
    } catch (e) {
      console.error('Failed to load questions:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400">
          Administrator privileges are required to view this panel. Use the "Assessor / Admin" switcher in the top bar to test admin features.
        </p>
      </div>
    );
  }

  const handleSaveQuestion = async (q: Question) => {
    try {
      await questionService.saveQuestion(q);
      setEditingQuestion(null);
      setIsCreatingNew(false);
      await loadAllQuestions();
      alert('Question saved successfully!');
    } catch (e: any) {
      alert(`Error saving question: ${e.message}`);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await questionService.deleteQuestion(id);
      await loadAllQuestions();
    } catch (e: any) {
      alert(`Error deleting question: ${e.message}`);
    }
  };

  const handleTogglePublication = async (q: Question) => {
    const nextStatus: PublicationStatus = q.publicationStatus === 'published' ? 'draft' : 'published';
    await questionService.saveQuestion({ ...q, publicationStatus: nextStatus });
    await loadAllQuestions();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ssb_mentor_question_bank_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePreviewImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      setImportPreview({
        total: items.length,
        valid: true,
        items,
      });
      setImportResult(null);
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message}`);
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview || !importPreview.valid) return;
    try {
      const res = await questionService.batchImportQuestions(importPreview.items);
      setImportResult(res);
      setImportPreview(null);
      setImportJsonText('');
      await loadAllQuestions();
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
    }
  };

  // Filter questions
  const filtered = questions.filter((q) => {
    const matchCat = categoryFilter === 'ALL' || q.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || q.publicationStatus === statusFilter;
    const matchQuery =
      searchQuery === '' ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStatus && matchQuery;
  });

  // Calculate summary counts
  const publishedCount = questions.filter((q) => q.publicationStatus === 'published').length;
  const draftCount = questions.filter((q) => q.publicationStatus === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <Database className="w-4 h-4" />
            <span>Master Question Bank & Testing Config</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Console
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Manage the centralized SSB question bank, review drafts, batch import questions, and adjust simulation parameters.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              const newQ: Question = {
                id: `q_${Date.now()}`,
                category: 'WAT',
                subcategory: 'WORD_ASSOCIATION',
                title: 'NEW ITEM',
                content: 'Item content or description',
                tags: ['manual_entry'],
                verificationStatus: 'verified',
                publicationStatus: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setEditingQuestion(newQ);
              setIsCreatingNew(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Item</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Bank</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Total Question Bank Items</div>
          <div className="text-2xl font-black text-white">{questions.length}</div>
        </div>
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Published to Students</div>
          <div className="text-2xl font-black text-emerald-400">{publishedCount}</div>
        </div>
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Drafts / In Review</div>
          <div className="text-2xl font-black text-amber-400">{draftCount}</div>
        </div>
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Extracted Categories</div>
          <div className="text-2xl font-black text-sky-400">8 Categories</div>
        </div>
      </div>

      {/* Bulk JSON Import Panel */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Bulk Ingestion Pipeline (Paste JSON Array)</span>
          </h3>
          <span className="text-xs text-slate-400">Idempotent Deduplication by ID</span>
        </div>

        <textarea
          value={importJsonText}
          onChange={(e) => setImportJsonText(e.target.value)}
          placeholder='[ { "id": "wat_9999", "category": "WAT", "subcategory": "WORD_ASSOCIATION", "title": "HONOR", "content": "HONOR", "publicationStatus": "published", "verificationStatus": "verified", "tags": ["virtue"] } ]'
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-hidden"
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePreviewImport}
            disabled={!importJsonText.trim()}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-semibold"
          >
            Preview Ingestion Batch
          </button>

          {importPreview && (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-emerald-400">
                Found {importPreview.total} valid item(s) ready to import
              </span>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Commit Import to Database
              </button>
            </div>
          )}

          {importResult && (
            <span className="text-xs text-emerald-400 font-bold">
              Imported {importResult.imported} items ({importResult.skipped} duplicates skipped).
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, keyword, word, or scenario..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white font-medium"
        >
          <option value="ALL">All Categories</option>
          <option value="WAT">WAT (Words)</option>
          <option value="TAT">TAT (Pictures)</option>
          <option value="SRT">SRT (Situations)</option>
          <option value="PPDT">PPDT (Screening)</option>
          <option value="LECTURETTE">Lecturette</option>
          <option value="GTO">GTO (GPE)</option>
          <option value="INTERVIEW">Interview</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Questions Data Table */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-700">
              <tr>
                <th className="p-3">ID & Category</th>
                <th className="p-3">Title / Prompt</th>
                <th className="p-3">Source Booklet</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {filtered.slice(0, 50).map((q) => (
                <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono">
                    <div className="font-bold text-white">{q.id}</div>
                    <span className="text-[10px] text-amber-400 bg-military-800 px-1 rounded uppercase">
                      {q.category}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate font-medium text-slate-200">
                    {q.title}
                    {q.content && <p className="text-[10px] text-slate-500 truncate">{q.content}</p>}
                  </td>
                  <td className="p-3 text-[11px] text-slate-400">
                    {q.sourceFilename || q.sourceReference || 'Master Repository'}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleTogglePublication(q)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                        q.publicationStatus === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      }`}
                    >
                      {q.publicationStatus}
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-md hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-700 text-xs text-slate-500 text-center font-mono">
          Showing {Math.min(50, filtered.length)} of {filtered.length} matching questions
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isCreatingNew ? 'Create New Question Bank Item' : `Edit Item: ${editingQuestion.id}`}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ID:</label>
                  <input
                    type="text"
                    value={editingQuestion.id}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category:</label>
                  <select
                    value={editingQuestion.category}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                  >
                    <option value="WAT">WAT</option>
                    <option value="TAT">TAT</option>
                    <option value="SRT">SRT</option>
                    <option value="PPDT">PPDT</option>
                    <option value="LECTURETTE">LECTURETTE</option>
                    <option value="GTO">GTO</option>
                    <option value="INTERVIEW">INTERVIEW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title / Short Prompt:</label>
                <input
                  type="text"
                  value={editingQuestion.title}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Detailed Content / Situation:</label>
                <textarea
                  value={editingQuestion.content || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Publication Status:</label>
                  <select
                    value={editingQuestion.publicationStatus}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, publicationStatus: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Verification Status:</label>
                  <select
                    value={editingQuestion.verificationStatus}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, verificationStatus: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                  >
                    <option value="verified">Verified</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveQuestion(editingQuestion)}
                className="px-5 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Question</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
