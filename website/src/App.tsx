import './index.css';

const App = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold tracking-tight">MyExpenseLog</h1>
      <p className="text-muted-foreground mt-2">Clean slate established. Ready for implementation.</p>
      <div className="mt-6 p-4 border rounded-lg bg-slate-100 dark:bg-slate-800">
        <p className="text-sm font-medium">Tailwind v4 + shadcn/ui baseline verified.</p>
      </div>
    </div>
  );
};

export default App;
