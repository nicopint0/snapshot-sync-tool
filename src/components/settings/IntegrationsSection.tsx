import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, CreditCard } from "lucide-react";
import IntegrationsWhatsApp from "./IntegrationsWhatsApp";
import IntegrationsPayments from "./IntegrationsPayments";

const IntegrationsSection = () => {
  const [activeTab, setActiveTab] = useState("whatsapp");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp Business
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="mt-6">
          <IntegrationsWhatsApp />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <IntegrationsPayments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsSection;
