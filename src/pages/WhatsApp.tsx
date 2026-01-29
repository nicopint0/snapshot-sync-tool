import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Send, Phone, MoreVertical, Paperclip, Smile, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import AppLayout from "@/components/layout/AppLayout";

interface Conversation {
  id: string;
  patientName: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: string;
  text: string;
  time: string;
  sent: boolean;
}

const WhatsApp = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [messageInput, setMessageInput] = useState("");

  // Mock data
  const conversations: Conversation[] = [
    { id: "1", patientName: "María López", lastMessage: "Perfecto, gracias por confirmar", time: "10:30", unread: 2 },
    { id: "2", patientName: "Carlos García", lastMessage: "¿A qué hora es mi cita?", time: "09:15", unread: 0 },
    { id: "3", patientName: "Ana Martínez", lastMessage: "Entendido, ahí estaré", time: "Ayer", unread: 0 },
    { id: "4", patientName: "Roberto Sánchez", lastMessage: "¿Tienen disponibilidad el viernes?", time: "Ayer", unread: 1 },
  ];

  const messages: Message[] = [
    { id: "1", text: "Hola María, te recordamos tu cita de mañana a las 10:00 AM para limpieza dental.", time: "09:00", sent: true },
    { id: "2", text: "¡Hola! Sí, ahí estaré. Gracias por el recordatorio.", time: "09:30", sent: false },
    { id: "3", text: "Perfecto. Recuerda llegar 10 minutos antes para el registro.", time: "09:32", sent: true },
    { id: "4", text: "Perfecto, gracias por confirmar", time: "10:30", sent: false },
  ];

  const templates = [
    "Recordatorio: Tu cita es mañana a las {hora}",
    "Hola {nombre}, ¿cómo te has sentido después del tratamiento?",
    "Te recordamos que tienes un saldo pendiente de ${monto}",
    "¡Feliz cumpleaños {nombre}! 🎂",
  ];

  const selectedPatient = conversations.find(c => c.id === selectedConversation);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-8rem)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                {conversations
                  .filter(c => c.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border ${
                        selectedConversation === conv.id ? "bg-muted/50" : ""
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {conv.patientName.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{conv.patientName}</p>
                          <span className="text-xs text-muted-foreground">{conv.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {conv.lastMessage}
                          </p>
                          {conv.unread > 0 && (
                            <Badge className="bg-green-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full">
                              {conv.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedPatient ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {selectedPatient.patientName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedPatient.patientName}</p>
                      <p className="text-xs text-muted-foreground">En línea</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sent
                              ? "bg-green-500 text-white rounded-br-none"
                              : "bg-muted rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.sent ? "text-green-100" : "text-muted-foreground"}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="icon" className="bg-green-500 hover:bg-green-600">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Selecciona una conversación</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default WhatsApp;