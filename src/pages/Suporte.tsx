import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";

export default function Suporte() {
  const { user, profile } = useAuth();

  const supportEmail = "trojilio.mga@gmail.com";

  const handleEmail = () => {
    const subject = encodeURIComponent("Solicitação de suporte - Gerenciar Frotas");
    const body = encodeURIComponent(
      `Olá,\n\nPreciso de suporte.\n\nNome: ${profile?.full_name || ""}\nEmail: ${user?.email || ""}\n\nDescrição: `
    );
    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <BackToHome />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
          <p className="text-muted-foreground">
            Entre em contato com nossa equipe para dúvidas, sugestões ou solicitações
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Email</CardTitle>
            <CardDescription>Envie um email detalhado para nossa equipe</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            
            <Button onClick={handleEmail} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
