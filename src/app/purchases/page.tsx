"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { formatDateDdMmYyyy } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { CreditCardPurchaseForm } from "@/components/credit-card-purchase-form";

type Category = { id: string; name: string };

type PurchaseRow = {
  id: string;
  creditCardId: string;
  categoryId: string;
  description: string;
  purchaseDate: string;
  totalAmountCents: number;
  isInstallmentPurchase: boolean;
  totalInstallments: number;
  currentInstallment: number;
  installmentAmountCents: number | null;
};

function PurchasesPageInner() {
  const searchParams = useSearchParams();
  const [cats, setCats] = useState<Category[]>([]);
  const [creditCardId, setCreditCardId] = useState("");
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchaseTab, setPurchaseTab] = useState<"all" | "cash" | "installment">("all");
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void fetch(`${base}/categories`).then(async (response) => {
      if (cancelled || !response.ok) return;
      setCats((await response.json()) as Category[]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!creditCardId) return;
    let cancelled = false;
    const base = getApiBase();
    void fetch(`${base}/credit-card-purchases?creditCardId=${encodeURIComponent(creditCardId)}`).then(
      async (response) => {
        if (cancelled || !response.ok) return;
        setPurchases((await response.json()) as PurchaseRow[]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [creditCardId]);

  async function refreshPurchasesList(cardId: string) {
    if (!cardId) return;
    const base = getApiBase();
    const response = await fetch(`${base}/credit-card-purchases?creditCardId=${encodeURIComponent(cardId)}`);
    if (!response.ok) return;
    setPurchases((await response.json()) as PurchaseRow[]);
  }

  const filteredPurchases = useMemo(() => {
    if (purchaseTab === "cash") return purchases.filter((purchase) => !purchase.isInstallmentPurchase);
    if (purchaseTab === "installment") return purchases.filter((purchase) => purchase.isInstallmentPurchase);
    return purchases;
  }, [purchases, purchaseTab]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Compras no cartão" subtitle="Cadastro, preview de parcelas e ciclo de fatura" />

      <CreditCardPurchaseForm
        variant="page"
        initialCreditCardId={searchParams.get("creditCardId")}
        statementId={searchParams.get("statementId")}
        editingPurchaseId={editingPurchaseId}
        onCreditCardIdChange={setCreditCardId}
        onCancelEdit={() => setEditingPurchaseId(null)}
        onSaved={(cardId) => {
          setCreditCardId(cardId);
          void refreshPurchasesList(cardId);
        }}
      />

      <SectionCard title="Compras deste cartão" contentClassName="pt-0">
        {!creditCardId ? (
          <EmptyState title="Selecione um cartão" description="Escolha o cartão no formulário acima." />
        ) : (
          <Tabs value={purchaseTab} onValueChange={(v) => setPurchaseTab(v as typeof purchaseTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="cash">À vista</TabsTrigger>
              <TabsTrigger value="installment">Parceladas</TabsTrigger>
            </TabsList>
            <TabsContent value={purchaseTab} className="mt-0">
              {filteredPurchases.length === 0 ? (
                <EmptyState title="Nenhuma compra" description="Nada neste filtro para o cartão selecionado." />
              ) : (
                <DataTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Parcelas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{formatDateDdMmYyyy(purchase.purchaseDate)}</TableCell>
                          <TableCell className="font-medium">{purchase.description}</TableCell>
                          <TableCell>
                            {cats.find((category) => category.id === purchase.categoryId)?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatBRLFromCents(purchase.totalAmountCents)}</TableCell>
                          <TableCell>
                            {purchase.isInstallmentPurchase ? (
                              <Badge variant="secondary">
                                {purchase.currentInstallment}/{purchase.totalInstallments}
                              </Badge>
                            ) : (
                              <Badge variant="outline">À vista</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingPurchaseId(purchase.id)}>
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTable>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SectionCard>
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 sm:space-y-8">
          <PageHeader title="Compras no cartão" subtitle="Cadastro, preview de parcelas e ciclo de fatura" />
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      }
    >
      <PurchasesPageInner />
    </Suspense>
  );
}
