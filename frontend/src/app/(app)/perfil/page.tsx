"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronRight,
  LogOut,
  MessageSquare,
  Phone,
  Receipt,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RemindersList } from "@/components/perfil/RemindersList";
import { ThemeToggle } from "@/components/perfil/ThemeToggle";
import { useApi } from "@/lib/hooks/useApi";
import { ApiError } from "@/lib/api";
import type { MeResponse } from "@/lib/types";

export default function PerfilPage() {
  const callApi = useApi();
  const { data: session } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.backendToken) return;
    callApi<MeResponse>("/auth/me")
      .then((data) => {
        setMe(data);
        setPhone(data.phone ?? "");
      })
      .catch(() => setMe(null));
  }, [callApi, session?.backendToken]);

  async function savePhone() {
    setPhoneMsg(null);
    try {
      await callApi("/perfil/telefone", { method: "PATCH", body: { phone } });
      setEditingPhone(false);
      setMe((cur) => (cur ? { ...cur, phone } : cur));
      setPhoneMsg("Telefone atualizado.");
    } catch {
      setPhoneMsg("Falha ao salvar.");
    }
  }

  async function savePassword() {
    setPwdMsg(null);
    try {
      await callApi("/perfil/senha", {
        method: "PATCH",
        body: { current_password: currentPwd, new_password: newPwd },
      });
      setEditingPassword(false);
      setCurrentPwd("");
      setNewPwd("");
      setPwdMsg("Senha alterada.");
    } catch (err) {
      setPwdMsg(err instanceof ApiError ? err.message : "Falha ao alterar.");
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <header className="space-y-1">
        {me ? (
          <>
            <h1 className="text-2xl font-semibold">{me.name}</h1>
            <p className="text-sm text-muted-foreground">{me.email}</p>
          </>
        ) : (
          <>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </>
        )}
      </header>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Telefone</h2>
        {!editingPhone ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{me?.phone ?? "—"}</p>
            <Button variant="outline" size="sm" onClick={() => setEditingPhone(true)}>
              Editar
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingPhone(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={savePhone}>
                Salvar
              </Button>
            </div>
          </div>
        )}
        {phoneMsg && <p className="text-xs text-muted-foreground">{phoneMsg}</p>}
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Senha</h2>
        {!editingPassword ? (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditingPassword(true)}>
              Editar
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="cur">Senha atual</Label>
            <Input
              id="cur"
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
            />
            <Label htmlFor="new">Nova senha</Label>
            <Input
              id="new"
              type="password"
              minLength={8}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingPassword(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={savePassword}>
                Salvar
              </Button>
            </div>
          </div>
        )}
        {pwdMsg && <p className="text-xs text-muted-foreground">{pwdMsg}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Meus lembretes</h2>
        <RemindersList />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Atalhos</h2>
        <Shortcut href="/perfil/categoria" icon={Tag} label="Categoria tarifária" sub={me?.fare_category_slug ?? undefined} />
        <Shortcut href="/perfil/atividade" icon={Receipt} label="Atividade" />
        <Shortcut href="/perfil/feedback" icon={MessageSquare} label="Enviar feedback" />
        <Shortcut href="/tarifas" icon={Phone} label="Tarifas e formas de pagamento" />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Aparência</h2>
        <ThemeToggle />
      </section>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}

function Shortcut(props: {
  href: string;
  icon: typeof Tag;
  label: string;
  sub?: string;
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-accent/40"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
        <span className="text-sm">{props.label}</span>
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {props.sub && <span className="uppercase">{props.sub}</span>}
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
