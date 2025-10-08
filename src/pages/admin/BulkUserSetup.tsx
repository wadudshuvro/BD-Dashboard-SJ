import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface OperationResult {
  type: 'create' | 'update';
  name: string;
  success: boolean;
  error?: string;
}

export default function BulkUserSetup() {
  const navigate = useNavigate();
  const { createUser, updateUser } = useAdminUsers();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OperationResult[]>([]);

  const newUsers = [
    { firstName: 'Mehedi', email: 'mehedi@sjinnovation.com', title: 'Module Lead (UI/UX)' },
    { firstName: 'Evelyn', email: 'evelyn@sjinnovation.com', title: 'Content Writer' },
    { firstName: 'Tuly', email: 'tuly@sjinnovation.com', title: 'Jr. Marketing Executive' },
    { firstName: 'Biplob', email: 'biplob@sjinnovation.com', title: 'Jr. Marketing Executive' },
    { firstName: 'Debanjan', email: 'debanjan@sjinnovation.com', title: 'Jr. Marketing Executive' },
  ];

  const executeSetup = async () => {
    setIsProcessing(true);
    setResults([]);
    const operationResults: OperationResult[] = [];

    // Create new users
    for (const user of newUsers) {
      try {
        await createUser({
          email: user.email,
          password: 'Welcome@2025',
          firstName: user.firstName,
          lastName: '',
          role: 'user',
          status: 'active',
          title: user.title,
          department: 'Marketing',
          isMarketing: true,
        });
        operationResults.push({
          type: 'create',
          name: `${user.firstName} (${user.email})`,
          success: true,
        });
      } catch (error: any) {
        operationResults.push({
          type: 'create',
          name: `${user.firstName} (${user.email})`,
          success: false,
          error: error.message || 'Failed to create user',
        });
      }
    }

    // Update Anik's title
    try {
      await updateUser('c1579d9d-f7d9-4f60-b83a-c61f6209f64e', {
        title: 'Project Coordinator',
      });
      operationResults.push({
        type: 'update',
        name: 'Anik (anik.kumar@sjinnovation.com)',
        success: true,
      });
    } catch (error: any) {
      operationResults.push({
        type: 'update',
        name: 'Anik (anik.kumar@sjinnovation.com)',
        success: false,
        error: error.message || 'Failed to update user',
      });
    }

    setResults(operationResults);
    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk User Setup</h1>
          <p className="text-muted-foreground mt-2">
            Add 5 new marketing team members and update Anik's title
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/adminpanel/users')}>
          Back to Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations to Execute</CardTitle>
          <CardDescription>
            This will create 5 new users and update 1 existing user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">New Users to Create (5):</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {newUsers.map((user) => (
                <li key={user.email}>
                  {user.firstName} - {user.title} ({user.email})
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">User to Update (1):</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Anik - Update title to "Project Coordinator"</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={executeSetup}
              disabled={isProcessing || results.length > 0}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : results.length > 0 ? (
                'Completed'
              ) : (
                'Execute Setup'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {result.type === 'create' ? 'Created' : 'Updated'}: {result.name}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
