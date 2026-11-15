"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { allPages, errorMessage } from "../../lib/api";
import { toService, toTransaction } from "../../lib/adapters";
import type {
  BookingDto,
  Service,
  ServiceDto,
  Transaction,
  User,
} from "../../types/domain";

interface DashboardData {
  services: Service[];
  transactions: Transaction[];
}

// Pede à API os serviços e as contratações da pessoa autenticada.
const fetchData = async (user: Pick<User, "id" | "role">): Promise<DashboardData> => {
  const [services, bookings] = await Promise.all([
    // O cliente vê todos os serviços; o prestador, só os seus.
    allPages<ServiceDto>(
      "/services",
      user.role === "CLIENT" ? {} : { providerId: user.id },
    ),
    allPages<BookingDto>("/bookings"),
  ]);
  return {
    services: services.map(toService),
    transactions: bookings.map(toTransaction),
  };
};

// Os dados do painel. Carregam ao abrir e voltam a carregar com `reload` (depois de cada operação).
export function useDashboardData(user: User, onError: (message: string) => void) {
  const [data, setData] = useState<DashboardData>({ services: [], transactions: [] });
  const { id, role } = user;
  // Só vale a resposta do pedido mais recente: com dois recarregamentos seguidos, a lista antiga
  // não pode chegar depois e sobrepor-se à nova.
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latest.current;
    const next = await fetchData({ id, role });
    if (request === latest.current) setData(next);
  }, [id, role]);

  useEffect(() => {
    let active = true;
    const request = ++latest.current;
    fetchData({ id, role })
      .then((next) => {
        if (active && request === latest.current) setData(next);
      })
      .catch((error: unknown) => {
        if (active) onError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [id, role, onError]);

  return { ...data, reload };
}
