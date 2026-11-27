import { useCallback, useEffect, useState } from 'react';
import { FolderPlus, Sparkles } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { Button } from '../../shared/ui/Button';
import { toast } from '../../shared/ui/ToastProvider';
import { CreateProjectModal } from './CreateProjectModal';
import type { CreativeProjectItem, ProjectStage } from './Creative.types';
import { ProjectActionModal, type ProjectModalMode } from './ProjectActionModal';
import { ProjectCard } from './ProjectCard';
import { ProjectInvoiceModal } from './ProjectInvoiceModal';

export function ProjectsPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [projects, setProjects] = useState<CreativeProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [modalProject, setModalProject] = useState<CreativeProjectItem | null>(null);
  const [modalMode, setModalMode] = useState<ProjectModalMode>('deliverable');
  const [invoiceProject, setInvoiceProject] = useState<CreativeProjectItem | null>(null)

  const loadProjects = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    setLoading(true);
    const res = await apiFetch<{ projects: CreativeProjectItem[] }>(
      `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/projects`
    );
    if (res.ok && res.body.data) setProjects(res.body.data.projects);
    setLoading(false);
  }, [activeBusiness?.id, activeBranch?.id]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  if (!activeBusiness || !activeBranch) return null;

  const handleStageChange = async (projectId: string, stage: ProjectStage) => {
    const res = await apiFetch(`/workspace/businesses/${activeBusiness.id}/projects/${projectId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
    if (res.ok) {
      toast.success('Project stage updated.', 'Saved');
      void loadProjects();
    }
  };

  const handleToggleDeliverable = async (projectId: string, logId: string) => {
    await apiFetch(`/workspace/businesses/${activeBusiness.id}/projects/${projectId}/logs/${logId}/toggle`, {
      method: 'PATCH',
    });
    void loadProjects();
  };

  const handleSaveDeliveryUrl = async (projectId: string, deliveryUrl: string) => {
    const res = await apiFetch(`/workspace/businesses/${activeBusiness.id}/projects/${projectId}/delivery-url`, {
      method: 'PATCH',
      body: JSON.stringify({ delivery_url: deliveryUrl }),
    });
    if (res.ok) {
      toast.success('Final deliverable link saved!', 'Saved');
      void loadProjects();
    } else {
      toast.error(res.body.message || 'Invalid URL.', 'Error');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Projects &amp; Deliverables</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track client scopes, hours spent, revisions, milestone payments, and monthly retainers for <strong>{activeBusiness.name}</strong>.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <FolderPlus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
          Loading creative projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No active creative projects yet</p>
          <p className="text-xs text-slate-500">Click &ldquo;New Project&rdquo; to quote a client project or set up a monthly retainer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onStageChange={handleStageChange}
              onToggleDeliverable={handleToggleDeliverable}
              onSaveDeliveryUrl={handleSaveDeliveryUrl}
              onOpenInvoice={setInvoiceProject}
              onOpenModal={(proj, mode) => {
                setModalProject(proj);
                setModalMode(mode);
              }}
            />
          ))}
        </div>
      )}

      <ProjectInvoiceModal
        project={invoiceProject}
        businessName={activeBusiness.name}
        branchName={activeBranch.name}
        showPoweredBy
        onClose={() => setInvoiceProject(null)}
      />


      <CreateProjectModal
        open={createOpen}
        businessId={activeBusiness.id}
        branchId={activeBranch.id}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void loadProjects()}
      />

      <ProjectActionModal
        key={`${modalProject?.id || 'none'}-${modalMode}`}
        project={modalProject}
        mode={modalMode}
        businessId={activeBusiness.id}
        branchId={activeBranch.id}
        onClose={() => setModalProject(null)}
        onSaved={() => void loadProjects()}
      />
    </div>
  );
}
