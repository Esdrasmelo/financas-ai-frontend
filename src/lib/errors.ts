import { ApiError } from "./api";

const networkMessages: Record<string, string> = {
  "Failed to fetch": "Não foi possível conectar ao servidor. Verifique sua conexão.",
  "NetworkError when attempting to fetch resource.": "Não foi possível conectar ao servidor. Verifique sua conexão.",
  "Load failed": "Não foi possível conectar ao servidor. Verifique sua conexão.",
};

const statusMessages: Record<number, string> = {
  0: "Não foi possível conectar ao servidor. Verifique sua conexão.",
  401: "Email ou senha inválidos.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "Recurso não encontrado.",
  408: "A requisição demorou demais. Tente novamente.",
  429: "Muitas tentativas. Aguarde um momento e tente novamente.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
  502: "Servidor indisponível. Tente novamente mais tarde.",
  503: "Serviço temporariamente fora do ar. Tente novamente mais tarde.",
};

export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.message && err.message !== err.status.toString()) {
      return err.message;
    }
    return statusMessages[err.status] ?? `Erro inesperado (${err.status}). Tente novamente.`;
  }

  if (err instanceof TypeError) {
    return networkMessages[err.message] ?? "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  if (err instanceof Error) {
    return networkMessages[err.message] ?? err.message;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}
