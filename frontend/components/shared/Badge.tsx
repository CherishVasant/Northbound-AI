'use client';

type BadgeVariant = 'completed' | 'in-progress' | 'review' | 'not-started' | 'dsa' | 'subjects' | 'projects' | 'aptitude' | 'certs';

const variantClasses: Record<BadgeVariant, string> = {
  completed: 'bg-status-completed-bg text-status-completed',
  'in-progress': 'bg-status-in-progress-bg text-status-in-progress',
  review: 'bg-status-review-bg text-status-review',
  'not-started': 'bg-status-not-started-bg text-status-not-started',
  dsa: 'bg-module-dsa-bg text-module-dsa',
  subjects: 'bg-module-subjects-bg text-module-subjects',
  projects: 'bg-module-projects-bg text-module-projects',
  aptitude: 'bg-module-aptitude-bg text-module-aptitude',
  certs: 'bg-module-certs-bg text-module-certs',
};

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'in-progress', className = '', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
