"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiBase } from "@/lib/api";

type Category = { id: string; name: string; type: string };

export default function CategoriesPage() {
  const [list, setList] = useState<Category[]>([]);
  const [name, setName] = useState("");

  async function refreshList() {
    const base = getApiBase();
    const r = await fetch(`${base}/categories`);
    if (r.ok) setList((await r.json()) as Category[]);
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const r = await fetch(`${base}/categories`);
      if (cancelled || !r.ok) return;
      setList((await r.json()) as Category[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createCat(e: React.FormEvent) {
    e.preventDefault();
    const base = getApiBase();
    const r = await fetch(`${base}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "expense" }),
    });
    if (!r.ok) {
      toast.error("Erro ao criar categoria");
      return;
    }
    setName("");
    toast.success("Categoria criada");
    void refreshList();
  }

  async function remove(id: string) {
    const base = getApiBase();
    const r = await fetch(`${base}/categories/${id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error("Não foi possível excluir (pode haver vínculos)");
      return;
    }
    toast.success("Removida");
    void refreshList();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <p className="text-sm text-zinc-500">CRUD simples de classificação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-4" onSubmit={createCat}>
            <div className="space-y-2">
              <Label htmlFor="n">Nome</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>
                    <Button type="button" variant="outline" size="sm" onClick={() => void remove(c.id)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
