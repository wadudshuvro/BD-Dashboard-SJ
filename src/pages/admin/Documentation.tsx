import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Workflow, Code, Database } from 'lucide-react';

const documentationItems = [
  {
    id: 'n8n-eod-workflow',
    title: 'N8n EOD Workflow Setup',
    description: 'Complete guide for setting up the EOD data sync workflow in N8n',
    icon: Workflow,
    category: 'Integration',
  },
  // Add more documentation items here in the future
];

export default function Documentation() {
  const [selectedDoc, setSelectedDoc] = useState(documentationItems[0].id);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Documentation
        </h1>
        <p className="text-muted-foreground mt-2">
          Technical guides and setup instructions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Sidebar with doc list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Guides</CardTitle>
            <CardDescription>Select a documentation guide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {documentationItems.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedDoc === doc.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <doc.icon className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="font-medium text-sm">{doc.title}</div>
                  <div className={`text-xs ${
                    selectedDoc === doc.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {doc.category}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Main content area */}
        <div>
          {selectedDoc === 'n8n-eod-workflow' && <N8nEODWorkflowDoc />}
        </div>
      </div>
    </div>
  );
}

function N8nEODWorkflowDoc() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-6 w-6" />
          N8n Workflow Setup for EOD Integration
        </CardTitle>
        <CardDescription>
          Complete guide for Pritesh to set up ActiveCollab data sync
        </CardDescription>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none dark:prose-invert">
        <h2>Overview</h2>
        <p>
          This workflow will fetch task data and time records from ActiveCollab daily and send them to our Supabase Edge Function.
        </p>

        <h2>Workflow Trigger</h2>
        <div className="bg-muted p-4 rounded-lg">
          <p className="font-semibold mb-2">Schedule: Daily at 6:00 PM (end of business day)</p>
          <p className="font-mono text-sm">Cron expression: 0 18 * * *</p>
        </div>

        <h2>Workflow Steps</h2>

        <Tabs defaultValue="step1" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="step1">Step 1</TabsTrigger>
            <TabsTrigger value="step2">Step 2</TabsTrigger>
            <TabsTrigger value="step3">Step 3</TabsTrigger>
            <TabsTrigger value="step4">Step 4</TabsTrigger>
          </TabsList>

          <TabsContent value="step1" className="space-y-4">
            <h3 className="text-lg font-semibold mt-4">Step 1: Fetch Tasks Updated Today</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold">Node Type: HTTP Request</p>
              <ul className="space-y-1">
                <li>Method: GET</li>
                <li>URL: https://[your-activecollab-url]/api/v1/projects/[project-id]/tasks</li>
                <li>Authentication: Bearer Token (ActiveCollab API Key)</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Query Parameters:</p>
              <pre className="text-xs overflow-x-auto">
{`updated_on_from: {{ $now.format('YYYY-MM-DD') }}
updated_on_to: {{ $now.format('YYYY-MM-DD') }}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Expected Response:</p>
              <pre className="text-xs overflow-x-auto">
{`{
  "tasks": [
    {
      "id": 123,
      "name": "Implement feature X",
      "assignee_id": 456,
      "project_id": 789,
      "completed_on": "2025-10-08T15:30:00Z",
      "is_completed": true,
      "comments": [...]
    }
  ]
}`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="step2" className="space-y-4">
            <h3 className="text-lg font-semibold mt-4">Step 2: Fetch Time Records for Today</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold">Node Type: HTTP Request</p>
              <ul className="space-y-1">
                <li>Method: GET</li>
                <li>URL: https://[your-activecollab-url]/api/v1/projects/[project-id]/time-records</li>
                <li>Authentication: Bearer Token (ActiveCollab API Key)</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Query Parameters:</p>
              <pre className="text-xs overflow-x-auto">
{`from: {{ $now.format('YYYY-MM-DD') }}
to: {{ $now.format('YYYY-MM-DD') }}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Expected Response:</p>
              <pre className="text-xs overflow-x-auto">
{`{
  "time_records": [
    {
      "id": 111,
      "task_id": 123,
      "user_id": 456,
      "value": 5.5,
      "record_date": "2025-10-08",
      "summary": "Implemented feature and tested"
    }
  ]
}`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="step3" className="space-y-4">
            <h3 className="text-lg font-semibold mt-4">Step 3: Transform Data</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Node Type: Function / Code</p>
              <p className="text-sm mb-2">Combine tasks and time records into the format our edge function expects</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">JavaScript Code:</p>
              <pre className="text-xs overflow-x-auto">
{`// Get tasks from previous node
const tasks = $input.first().json.tasks;
const timeRecords = $input.all()[1].json.time_records;

// Create a map of task_id -> hours
const hoursMap = {};
timeRecords.forEach(record => {
  if (!hoursMap[record.task_id]) {
    hoursMap[record.task_id] = 0;
  }
  hoursMap[record.task_id] += record.value;
});

// Transform to our format
const transformedData = {
  sync_date: new Date().toISOString().split('T')[0],
  tasks: tasks.map(task => ({
    external_task_id: task.id.toString(),
    task_name: task.name,
    assignee_email: task.assignee_email || null,
    assignee_id: task.assignee_id,
    project_id: task.project_id.toString(),
    status: task.is_completed ? 'completed' : 'in_progress',
    last_comment: task.comments?.length > 0 
      ? task.comments[task.comments.length - 1].body 
      : null,
    last_comment_date: task.comments?.length > 0
      ? task.comments[task.comments.length - 1].created_on
      : null,
    hours_logged: hoursMap[task.id] || 0,
    raw_data: task
  }))
};

return transformedData;`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="step4" className="space-y-4">
            <h3 className="text-lg font-semibold mt-4">Step 4: Send to Supabase Edge Function</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold">Node Type: HTTP Request</p>
              <ul className="space-y-1">
                <li>Method: POST</li>
                <li className="font-mono text-xs">URL: https://fzknasqrludvoyxdzbxl.supabase.co/functions/v1/eod-data-sync</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Headers:</p>
              <pre className="text-xs overflow-x-auto">
{`Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
x-webhook-secret: [WEBHOOK_SECRET]`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Body:</p>
              <p className="text-sm">Use output from Step 3 (transformed data)</p>
            </div>
          </TabsContent>
        </Tabs>

        <h2 className="mt-8">Data You Need to Provide</h2>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              1. ActiveCollab API Credentials
            </h3>
            <ul className="space-y-1 text-sm">
              <li>• API URL: https://[your-company].activecollab.com/api/v1</li>
              <li>• API Token: Your ActiveCollab API key</li>
              <li>• Project IDs: List of project IDs to monitor</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Code className="h-4 w-4" />
              2. User Email Mapping
            </h3>
            <p className="text-sm mb-2">Map ActiveCollab user IDs/emails to our internal user IDs:</p>
            <pre className="text-xs overflow-x-auto bg-muted p-2 rounded">
{`{
  "activecollab_users": [
    {
      "ac_user_id": 456,
      "ac_email": "john@company.com",
      "our_user_id": "uuid-from-our-system"
    }
  ]
}`}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Code className="h-4 w-4" />
              3. Project Mapping
            </h3>
            <p className="text-sm mb-2">Map ActiveCollab projects to our internal projects:</p>
            <pre className="text-xs overflow-x-auto bg-muted p-2 rounded">
{`{
  "project_mappings": [
    {
      "ac_project_id": 789,
      "our_project_id": "uuid-from-our-system",
      "project_name": "Client Website Redesign"
    }
  ]
}`}
            </pre>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">4. Webhook Secret</h3>
            <p className="text-sm mb-2">
              Generate a secure webhook secret (random string) that will be used to authenticate requests from N8n to our edge function.
            </p>
            <p className="text-sm font-mono">Example: whs_7f8d9e6c5b4a3f2e1d0c9b8a7f6e5d4c</p>
            <p className="text-sm mt-2 text-orange-600 dark:text-orange-400">
              Share this with the dev team so they can configure the edge function to validate it.
            </p>
          </div>
        </div>

        <h2 className="mt-8">Testing the Workflow</h2>
        <div className="space-y-2">
          <h3 className="font-semibold">Manual Trigger:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create the workflow in N8n</li>
            <li>Use "Execute Workflow" button to test</li>
            <li>Check the edge function logs in Supabase dashboard</li>
            <li>Verify data appears in activecollab_task_data table</li>
          </ol>
        </div>

        <h2 className="mt-8">Troubleshooting</h2>
        <div className="space-y-2">
          <h3 className="font-semibold">Common Issues:</h3>
          <ul className="space-y-1">
            <li>• <strong>401 Unauthorized:</strong> Check ActiveCollab API token</li>
            <li>• <strong>403 Forbidden:</strong> Verify webhook secret matches</li>
            <li>• <strong>404 Not Found:</strong> Verify edge function is deployed</li>
            <li>• <strong>500 Server Error:</strong> Check edge function logs in Supabase</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg mt-8">
          <h3 className="font-semibold mb-2">Next Steps</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Set up the workflow in N8n</li>
            <li>Test with manual execution</li>
            <li>Provide the team with user mapping, project mapping, and webhook secret</li>
            <li>Schedule the workflow for daily execution</li>
            <li>Monitor for the first few days</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
