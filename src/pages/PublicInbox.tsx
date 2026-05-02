import { DisposableInboxView } from "@/components/disposable-inbox/DisposableInboxView";

const PublicInbox = () => (
  <div className="container mx-auto py-8 px-4 max-w-4xl">
    <div className="mb-6">
      <h1 className="text-3xl font-bold">Free Disposable Email</h1>
      <p className="text-muted-foreground mt-1">Create a temporary email address and receive messages instantly. No signup required.</p>
    </div>
    <DisposableInboxView mode="public" />
  </div>
);

export default PublicInbox;
