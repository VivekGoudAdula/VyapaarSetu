import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, ArrowLeft } from 'lucide-react';

/**
 * 404 Not Found Page for unmatched routes.
 */
export function NotFoundPage() {
  return (
    <div className="py-12 flex items-center justify-center">
      <EmptyState
        icon={<AlertCircle className="w-6 h-6 text-amber-600" />}
        title="Page Not Found"
        description="The requested route does not exist or has not yet been introduced in this roadmap phase."
        action={
          <Link to="/">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Overview
            </Button>
          </Link>
        }
      />
    </div>
  );
}

