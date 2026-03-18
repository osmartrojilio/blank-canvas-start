import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackToHome() {
  const navigate = useNavigate();
  return (
    <div className="mb-4">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Início
      </Button>
    </div>
  );
}
