const AdminSheets = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sheets</h1>
        <p className="text-sm text-muted-foreground">Manage your sheets here.</p>
      </div>
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-background">
        No sheets yet.
      </div>
    </div>
  );
};

export default AdminSheets;
