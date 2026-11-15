"use client";

import { useCallback, useEffect, useState } from "react";
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

  const reload = useCallback(async () => {
    setData(await fetchData({ id, role }));
  }, [id, role]);

  useEffect(() => {
    let active = true;
    fetchData({ id, role })
      .then((next) => {
        if (active) setData(next);
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
