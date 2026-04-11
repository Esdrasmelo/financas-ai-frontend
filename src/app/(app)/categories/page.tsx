"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Tags, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table";
import { getApiBase, authFetch } from "@/lib/api";

type Category = { id: string; name: string; type: string };

export default function CategoriesPage() {
  const [list, setList] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function refreshList() {
    const base = getApiBase();
    const response = await authFetch(`${base}/categories`);
    if (response.ok) setList((await response.json()) as Category[]);
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await authFetch(`${base}/categories`);
      if (cancelled || !response.ok) return;
      setList((await response.json()) as Category[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((category) => category.name.toLowerCase().includes(query));
  }, [list, search]);

  async function createCat(e: React.FormEvent) {
    e.preventDefault();
    const base = getApiBase();
    const response = await authFetch(`${base}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "expense" }),
    });
    if (!response.ok) {
      toast.error("Erro ao criar categoria");
      return;
    }
    setName("");
    toast.success("Categoria criada");
    void refreshList();
  }

  async function remove(id: string) {
    const base = getApiBase();
    const response = await authFetch(`${base}/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Não foi possível excluir (pode haver vínculos)");
      return;
    }
    toast.success("Removida");
    void refreshList();
    setDeleteId(null);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Categorias"
        subtitle="Classifique gastos e compras com consistência"
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SectionCard title="Nova categoria" description="Nome e tipo padrão despesa">
          <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={createCat}>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="n">Nome</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Alimentação" />
            </div>
            <Button type="submit">Salvar</Button>
          </form>
        </SectionCard>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <p className="text-sm font-medium text-foreground">Resumo</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{list.length}</p>
            <p className="text-sm text-muted-foreground">categorias cadastradas</p>
          </CardContent>
        </Card>
      </div>

      <SectionCard
        title="Lista de categorias"
        description={`${filtered.length} exibidas`}
        action={
          <div className="relative w-full min-w-[200px] sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar categorias"
            />
          </div>
        }
        contentClassName="pt-0"
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={Tags}
            title={list.length === 0 ? "Nenhuma categoria" : "Nenhum resultado"}
            description={list.length === 0 ? "Crie a primeira categoria ao lado." : "Ajuste o termo de busca."}
          />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.type === "income" ? "Receita" : "Despesa"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Menu de ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(category.id)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        )}
      </SectionCard>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Vínculos com lançamentos ou contas fixas impedem a exclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && void remove(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
