import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { useFiscalData } from "@/hooks/useFiscalData";
import { useCepLookup } from "@/hooks/useCepLookup";

const ESTADOS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

export function FiscalSettings() {
  const { fiscalData, loading, saveFiscalData } = useFiscalData();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ie: "", im: "", rntrc: "", crt: 1, cfop_padrao: "6353",
    cst_icms: "00", aliquota_icms: 0,
    zip_code: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", city_ibge_code: "", state: "",
  });

  useEffect(() => {
    if (fiscalData) {
      setForm({
        ie: fiscalData.ie || "", im: fiscalData.im || "", rntrc: fiscalData.rntrc || "",
        crt: fiscalData.crt || 1, cfop_padrao: fiscalData.cfop_padrao || "6353",
        cst_icms: fiscalData.cst_icms || "00", aliquota_icms: fiscalData.aliquota_icms || 0,
        zip_code: fiscalData.zip_code || "", street: fiscalData.street || "",
        number: fiscalData.number || "", complement: fiscalData.complement || "",
        neighborhood: fiscalData.neighborhood || "", city: fiscalData.city || "",
        city_ibge_code: fiscalData.city_ibge_code || "", state: fiscalData.state || "",
      });
    }
  }, [fiscalData]);

  const setField = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));
  const { lookupCep, loading: cepLoading } = useCepLookup();

  const handleCepChange = async (cep: string) => {
    setField("zip_code", cep);
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      const data = await lookupCep(cep);
      if (data) {
        setForm(prev => ({
          ...prev,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          city_ibge_code: data.ibge,
        }));
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await saveFiscalData(form);
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados Fiscais do Emitente</CardTitle>
          <CardDescription>Informações fiscais da sua empresa para preenchimento de CT-e na Treeunfe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Inscrição Estadual (IE)</label>
              <Input value={form.ie} onChange={e => setField("ie", e.target.value)} placeholder="Ex: 123456789" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Inscrição Municipal (IM)</label>
              <Input value={form.im} onChange={e => setField("im", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">RNTRC</label>
              <Input value={form.rntrc} onChange={e => setField("rntrc", e.target.value)} placeholder="Registro ANTT" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CRT</label>
              <Select value={String(form.crt)} onValueChange={v => setField("crt", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Simples Nacional</SelectItem>
                  <SelectItem value="2">2 - Simples Excesso</SelectItem>
                  <SelectItem value="3">3 - Regime Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CFOP Padrão</label>
              <Input value={form.cfop_padrao} onChange={e => setField("cfop_padrao", e.target.value)} placeholder="6353" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CST ICMS</label>
              <Select value={form.cst_icms} onValueChange={v => setField("cst_icms", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">00 - Tributado integralmente</SelectItem>
                  <SelectItem value="20">20 - Com redução BC</SelectItem>
                  <SelectItem value="40">40 - Isenta</SelectItem>
                  <SelectItem value="41">41 - Não tributada</SelectItem>
                  <SelectItem value="51">51 - Diferimento</SelectItem>
                  <SelectItem value="60">60 - ICMS cobrado anteriormente</SelectItem>
                  <SelectItem value="90">90 - Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alíquota ICMS (%)</label>
              <Input type="number" step="0.01" value={form.aliquota_icms} onChange={e => setField("aliquota_icms", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço do Emitente</CardTitle>
          <CardDescription>Endereço fiscal da empresa (usado no CT-e)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CEP {cepLoading && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}</label>
              <Input value={form.zip_code} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Logradouro</label>
              <Input value={form.street} onChange={e => setField("street", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número</label>
              <Input value={form.number} onChange={e => setField("number", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Complemento</label>
              <Input value={form.complement} onChange={e => setField("complement", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bairro</label>
              <Input value={form.neighborhood} onChange={e => setField("neighborhood", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input value={form.city} onChange={e => setField("city", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">UF</label>
              <Select value={form.state || ""} onValueChange={v => setField("state", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cód. IBGE Cidade</label>
              <Input value={form.city_ibge_code} onChange={e => setField("city_ibge_code", e.target.value)} placeholder="Ex: 3550308" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Dados Fiscais
        </Button>
      </div>
    </div>
  );
}
