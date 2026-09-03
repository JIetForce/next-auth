import { ChatWidget } from "@/components/chat/chat-widget";
import { getCurrentViewer } from "@/lib/auth/session";

// Async server component that gates the client widget on the viewer without
// passing any viewer object/PII across the server/client boundary — only the
// boolean. Wrapped in <Suspense> at the layout, mirroring HeaderAccount.
export async function ChatWidgetGate() {
  const viewer = await getCurrentViewer();
  return <ChatWidget isAuthenticated={viewer !== null} />;
}
