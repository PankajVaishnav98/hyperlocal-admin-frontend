import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shield } from 'lucide-react'

import { ApiError } from '../api/errors'
import { EmptyState } from '../components/states/SystemStates'
import { Button, Card } from '../components/ui/Primitives'
import { useAuth } from '../features/auth/authContext'
import { listAdminSessions, revokeAdminSession } from '../features/auth/sessionService'
import { PageHeader, QueryGate } from '../features/ops/ui'

export function SessionsPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['admin', 'sessions'],
    queryFn: listAdminSessions,
  })
  const revoke = useMutation({
    mutationFn: revokeAdminSession,
    onSuccess: async (result) => {
      if (result.current) {
        await auth.logout()
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signed-in devices"
        description="Revoke a lost operator session. Access and refresh tokens are never shown."
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.data?.length}
        emptyTitle="No active sessions"
        emptyDescription="There are no active refresh sessions for this operator."
      >
        <ul className="space-y-3">
          {query.data?.map((session) => (
            <li key={session.sessionId}>
              <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink-950">
                    {session.current ? 'This browser' : 'Other session'}
                  </p>
                  <p className="mt-1 text-sm text-ink-600">
                    {session.userAgent || 'Unknown client'}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Expires {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant={session.current ? 'secondary' : 'danger'}
                  onClick={() => revoke.mutate(session.sessionId)}
                  disabled={revoke.isPending}
                >
                  <Shield aria-hidden="true" className="size-4" />
                  {session.current ? 'Sign out here' : 'Revoke'}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </QueryGate>
      {revoke.isError ? (
        <EmptyState
          title="Could not revoke session"
          description={
            revoke.error instanceof ApiError
              ? revoke.error.message
              : 'Try again in a moment.'
          }
        />
      ) : null}
    </div>
  )
}
