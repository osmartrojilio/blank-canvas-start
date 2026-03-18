import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Ticket, Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons((data as unknown as Coupon[]) || []);
    } catch (err: any) {
      toast({ title: "Erro", description: "Não foi possível carregar cupons.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountPercent("");
    setMaxUses("");
    setValidUntil("");
    setIsActive(true);
    setEditingCoupon(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || "");
    setDiscountPercent(String(coupon.discount_percent));
    setMaxUses(coupon.max_uses != null ? String(coupon.max_uses) : "");
    setValidUntil(coupon.valid_until ? coupon.valid_until.split("T")[0] : "");
    setIsActive(coupon.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || !discountPercent) {
      toast({ title: "Erro", description: "Código e percentual são obrigatórios.", variant: "destructive" });
      return;
    }

    const percent = parseFloat(discountPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      toast({ title: "Erro", description: "Percentual deve ser entre 1 e 100.", variant: "destructive" });
      return;
    }

    const payload: Record<string, unknown> = {
      code: cleanCode,
      description: description || null,
      discount_percent: percent,
      max_uses: maxUses ? parseInt(maxUses) : null,
      valid_until: validUntil ? new Date(validUntil + "T23:59:59").toISOString() : null,
      is_active: isActive,
    };

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from("discount_coupons")
          .update(payload as any)
          .eq("id", editingCoupon.id);
        if (error) throw error;
        toast({ title: "Cupom atualizado" });
      } else {
        const { error } = await supabase
          .from("discount_coupons")
          .insert(payload as any);
        if (error) throw error;
        toast({ title: "Cupom criado" });
      }
      setDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (err: any) {
      const msg = err.message?.includes("unique") ? "Código já existe." : err.message;
      toast({ title: "Erro", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteCoupon) return;
    try {
      const { error } = await supabase.from("discount_coupons").delete().eq("id", deleteCoupon.id);
      if (error) throw error;
      setCoupons(prev => prev.filter(c => c.id !== deleteCoupon.id));
      setDeleteCoupon(null);
      toast({ title: "Cupom excluído" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    const newValue = !coupon.is_active;
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: newValue } : c));
    await supabase.from("discount_coupons").update({ is_active: newValue } as any).eq("id", coupon.id);
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    toast({ title: "Código copiado!" });
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Cupons de Desconto
            </CardTitle>
            <CardDescription>Gerencie cupons de desconto para os planos</CardDescription>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cupom
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : coupons.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum cupom cadastrado</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-sm bg-muted px-2 py-1 rounded">{coupon.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(coupon.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {coupon.description && <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{coupon.discount_percent}%</Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.current_uses}{coupon.max_uses != null ? ` / ${coupon.max_uses}` : " / ∞"}
                    </TableCell>
                    <TableCell>
                      {coupon.valid_until ? (
                        <span className={new Date(coupon.valid_until) < new Date() ? "text-destructive" : ""}>
                          {formatDate(coupon.valid_until)}
                        </span>
                      ) : "Sem limite"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={coupon.is_active} onCheckedChange={() => toggleActive(coupon)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteCoupon(coupon)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EX: DESCONTO10" maxLength={30} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição opcional" maxLength={100} />
            </div>
            <div>
              <Label>Percentual de Desconto (%) *</Label>
              <Input type="number" min="1" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="10" />
            </div>
            <div>
              <Label>Limite de Usos (vazio = ilimitado)</Label>
              <Input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="100" />
            </div>
            <div>
              <Label>Válido até (vazio = sem limite)</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingCoupon ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteCoupon} onOpenChange={(open) => !open && setDeleteCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cupom</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cupom <strong>{deleteCoupon?.code}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
