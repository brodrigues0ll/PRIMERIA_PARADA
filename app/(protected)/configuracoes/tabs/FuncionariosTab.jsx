"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, KeyRound, Loader2, UserCheck, UserX, ChevronRight, X } from "lucide-react";

const BLANK_NOVO = { name: "", email: "", password: "", cargo: "", role: "employee", permissionGroup: "" };
const BLANK_EDITAR = { name: "", email: "", cargo: "", role: "employee", permissionGroup: "", ativo: true };

function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-t border-border rounded-t-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FuncionariosTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null); // null | "novo" | "editar" | "senha"
  const [selected, setSelected] = useState(null);
  const [formNovo, setFormNovo] = useState(BLANK_NOVO);
  const [formEditar, setFormEditar] = useState(BLANK_EDITAR);
  const [novaSenha, setNovaSenha] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [ru, rg] = await Promise.all([
      fetch("/api/funcionarios").then((r) => r.json()),
      fetch("/api/grupos-permissao").then((r) => r.json()),
    ]);
    setUsers(Array.isArray(ru) ? ru : []);
    setGroups(Array.isArray(rg) ? rg : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNovo() {
    setFormNovo(BLANK_NOVO);
    setSheet("novo");
  }

  function openEditar(u) {
    setSelected(u);
    setFormEditar({
      name: u.name ?? "",
      email: u.email ?? "",
      cargo: u.cargo ?? "",
      role: u.role ?? "employee",
      permissionGroup: u.permissionGroup?._id ?? "",
      ativo: u.ativo ?? true,
    });
    setSheet("editar");
  }

  function openSenha(u) {
    setSelected(u);
    setNovaSenha("");
    setSheet("senha");
  }

  async function handleSaveNovo() {
    if (!formNovo.email || !formNovo.password) {
      toast.error("Email e senha são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const body = { ...formNovo, permissionGroup: formNovo.permissionGroup || null };
      const res = await fetch("/api/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar");
      toast.success("Funcionário criado");
      setSheet(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEditar() {
    setSaving(true);
    try {
      const body = { ...formEditar, permissionGroup: formEditar.permissionGroup || null };
      const res = await fetch(`/api/funcionarios/${selected._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      toast.success("Funcionário atualizado");
      setSheet(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSenha() {
    if (!novaSenha || novaSenha.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/funcionarios/${selected._id}/senha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaSenha }),
      });
      if (!res.ok) throw new Error("Erro ao alterar senha");
      toast.success("Senha alterada");
      setSheet(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u) {
    if (!confirm(`Excluir ${u.name || u.email}?`)) return;
    try {
      const res = await fetch(`/api/funcionarios/${u._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao excluir");
      toast.success("Funcionário removido");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {users.length} funcionário{users.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" onClick={openNovo} className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            Novo
          </Button>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">Nenhum funcionário</p>
            <p className="text-xs text-muted-foreground">Adicione o primeiro funcionário</p>
          </div>
        )}

        {users.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {users.map((u, idx) => {
              const initials = (u.name || u.email || "U")
                .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={u._id}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border">
                      {u.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.foto} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">{initials}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{u.name || "—"}</p>
                        {!u.ativo && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                            inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {u.role === "admin" ? "Admin" : "Funcionário"}
                        </span>
                        {u.permissionGroup && (
                          <span className="text-[10px] text-muted-foreground">{u.permissionGroup.nome}</span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openSenha(u)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEditar(u)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {u._id !== currentUserId && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {idx < users.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sheet: Novo funcionário */}
      <BottomSheet open={sheet === "novo"} onClose={() => setSheet(null)} title="Novo funcionário">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome</label>
            <Input value={formNovo.name} onChange={(e) => setFormNovo((p) => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email *</label>
            <Input type="email" value={formNovo.email} onChange={(e) => setFormNovo((p) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Senha inicial *</label>
            <Input type="password" value={formNovo.password} onChange={(e) => setFormNovo((p) => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Cargo</label>
            <Input value={formNovo.cargo} onChange={(e) => setFormNovo((p) => ({ ...p, cargo: e.target.value }))} placeholder="Ex: Garçom" />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Função</label>
            <div className="grid grid-cols-2 gap-2">
              {["employee", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFormNovo((p) => ({ ...p, role: r }))}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-medium border transition-colors",
                    formNovo.role === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {r === "admin" ? "Admin" : "Funcionário"}
                </button>
              ))}
            </div>
          </div>
          {formNovo.role === "employee" && groups.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Grupo de permissões</label>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setFormNovo((p) => ({ ...p, permissionGroup: "" }))}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors border-b border-border",
                    !formNovo.permissionGroup ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sem grupo
                  {!formNovo.permissionGroup && <span className="text-primary text-xs">✓</span>}
                </button>
                {groups.map((g, i) => (
                  <button
                    key={g._id}
                    onClick={() => setFormNovo((p) => ({ ...p, permissionGroup: g._id }))}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                      i < groups.length - 1 && "border-b border-border",
                      formNovo.permissionGroup === g._id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {g.nome}
                    {formNovo.permissionGroup === g._id && <span className="text-primary text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={saving} onClick={handleSaveNovo}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Sheet: Editar funcionário */}
      <BottomSheet open={sheet === "editar"} onClose={() => setSheet(null)} title={`Editar: ${selected?.name || selected?.email || ""}`}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome</label>
            <Input value={formEditar.name} onChange={(e) => setFormEditar((p) => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={formEditar.email} onChange={(e) => setFormEditar((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Cargo</label>
            <Input value={formEditar.cargo} onChange={(e) => setFormEditar((p) => ({ ...p, cargo: e.target.value }))} placeholder="Ex: Garçom" />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Função</label>
            <div className="grid grid-cols-2 gap-2">
              {["employee", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFormEditar((p) => ({ ...p, role: r }))}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-medium border transition-colors",
                    formEditar.role === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {r === "admin" ? "Admin" : "Funcionário"}
                </button>
              ))}
            </div>
          </div>
          {formEditar.role === "employee" && groups.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Grupo de permissões</label>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setFormEditar((p) => ({ ...p, permissionGroup: "" }))}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors border-b border-border",
                    !formEditar.permissionGroup ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sem grupo
                  {!formEditar.permissionGroup && <span className="text-primary text-xs">✓</span>}
                </button>
                {groups.map((g, i) => (
                  <button
                    key={g._id}
                    onClick={() => setFormEditar((p) => ({ ...p, permissionGroup: g._id }))}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                      i < groups.length - 1 && "border-b border-border",
                      formEditar.permissionGroup === g._id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {g.nome}
                    {formEditar.permissionGroup === g._id && <span className="text-primary text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Separator />
          {/* Status ativo */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Ativo</p>
              <p className="text-xs text-muted-foreground">Funcionário pode acessar o sistema</p>
            </div>
            <button
              onClick={() => setFormEditar((p) => ({ ...p, ativo: !p.ativo }))}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                formEditar.ativo
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              {formEditar.ativo
                ? <><UserCheck className="h-3.5 w-3.5" /> Ativo</>
                : <><UserX className="h-3.5 w-3.5" /> Inativo</>
              }
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={saving} onClick={handleSaveEditar}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Sheet: Alterar senha */}
      <BottomSheet open={sheet === "senha"} onClose={() => setSheet(null)} title={`Senha: ${selected?.name || selected?.email || ""}`}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nova senha</label>
            <Input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={saving} onClick={handleSaveSenha}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
