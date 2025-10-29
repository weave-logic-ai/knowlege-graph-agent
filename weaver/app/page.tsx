export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Weaver Workflow Server</h1>
      <p>Workflow DevKit is running on this Next.js server.</p>

      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /.well-known/workflow/v1/flow</code> - Workflow execution
        </li>
        <li>
          <code>POST /.well-known/workflow/v1/step</code> - Step execution
        </li>
      </ul>

      <h2>Available Workflows</h2>
      <ul>
        <li><strong>documentConnectionWorkflow</strong> - Automatic document linking</li>
      </ul>

      <h2>CLI Integration</h2>
      <p>Use the <code>weaver</code> CLI to interact with workflows:</p>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
{`# Watch vault and trigger workflows
weaver workflow watch /path/to/vault

# Manually trigger workflow
weaver workflow run document-connection --file README.md`}
      </pre>
    </div>
  );
}
