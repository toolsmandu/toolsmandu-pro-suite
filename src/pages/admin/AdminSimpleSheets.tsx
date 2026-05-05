import AdminSheets from "./AdminSheets";

const AdminSimpleSheets = () => (
  <AdminSheets
    kind="simple"
    title="Sheets"
    description="Create and manage your sheets."
    newButtonLabel="Add New Sheet"
    dialogTitle="Add New Sheet"
    basePath="/admin/sheets"
  />
);

export default AdminSimpleSheets;
