import { DisposableInboxView } from "@/components/disposable-inbox/DisposableInboxView";

const InboxPage = () => (
  <div className="p-4 md:p-6">
    <DisposableInboxView mode="user" persist={false} simpleMode />
  </div>
);

export default InboxPage;
