import { useLocation } from "react-router-dom";
import { DisposableInboxView } from "@/components/disposable-inbox/DisposableInboxView";

const InboxPage = () => {
  const location = useLocation();
  const initialEmail = (location.state as any)?.email as string | undefined;
  return (
    <div className="p-4 md:p-6">
      <DisposableInboxView mode="user" persist={false} simpleMode initialEmail={initialEmail} />
    </div>
  );
};

export default InboxPage;
