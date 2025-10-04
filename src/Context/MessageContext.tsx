import { createContext } from "react";

const MessageContext = createContext<{ messageApi: any } | null>(null);

export default MessageContext;