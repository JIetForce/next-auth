# Исследование: инициализация Next.js, best practices, архитектура и страница авторизации

> **Актуальность:** август 2026. В документе используются Next.js 16.x, App Router, Turbopack по умолчанию и Auth.js v5 (`next-auth@beta`).

---

## 1. Инициализация Next.js-проекта

### 1.1. Рекомендуемый способ — `create-next-app`

Официальная документация и CLI рекомендуют начинать новый проект с `create-next-app`:

```bash
# с npm
npx create-next-app@latest my-app

# с pnpm (быстрее, экономит диск)
pnpm create next-app@latest my-app --yes

# с yarn
yarn create next-app my-app
```

При запуске без `--yes` CLI задаёт вопросы:

- Название проекта
- Использовать рекомендуемые дефолты: TypeScript, ESLint, Tailwind CSS, App Router, Turbopack, `@/*`, `AGENTS.md`
- Или настроить вручную: линтер (ESLint / Biome / None), React Compiler, `src/`-директория, кастомный алиас и т.д.

Флаг `--yes` пропускает все вопросы и применяет сохранённые настройки либо разумные значения по умолчанию.

### 1.2. Ручная установка

Если CLI не подходит, можно собрать проект вручную:

```bash
npm i next@latest react@latest react-dom@latest
```

Затем нужно самостоятельно создать:

- `package.json` со скриптами `dev`, `build`, `start`, `lint`
- `app/layout.tsx` (корневой layout с `<html>` и `<body>`)
- `app/page.tsx`
- `next.config.ts` / `.js`
- `tsconfig.json` (Next.js подсветит недостающие зависимости при `next dev`)
- `public/`, `.env.local`, `.gitignore`

### 1.3. Сравнение подходов

| Критерий                       | `create-next-app`                   | Ручная настройка              |
| ------------------------------ | ----------------------------------- | ----------------------------- |
| Скорость старта                | Мгновенно                           | Медленно                      |
| Актуальность конфига           | Генерирует свежие Next.js-конвенции | Риск устаревших настроек      |
| TypeScript / ESLint / Tailwind | Встроены                            | Нужно подключать вручную      |
| Повторяемость                  | Высокая в команде                   | Зависит от разработчика       |
| Гибкость                       | Через флаги и `--example`           | Полная, но требует знаний     |
| Обучающая ценность             | Меньше деталей                      | Лучше понимание внутренностей |

**Вывод:** для боевых проектов используйте `npx create-next-app@latest` (или аналог `pnpm`/`yarn`). Ручная установка оправдана только для обучения, микро-демо или если шаблон CLI не устраивает по политическим/техническим причинам.

### 1.4. Системные требования

- **Node.js** `>= 20.9`
- **TypeScript** `>= 5.1.0`
- Браузеры: Chrome/Edge/Firefox `111+`, Safari `16.4+`

Turbopack — bundler по умолчанию для `next dev`. Для возврата к Webpack используйте `--webpack`.

---

## 2. Лучшие практики разработки Next.js

### 2.1. App Router вместо Pages Router

- Новые проекты должны использовать **App Router** (`app/`).
- **Server Components** — дефолт. Они не идут в клиентский бандл, могут быть `async`, безопасно обращаются к API-ключам и БД.
- **Client Components** (`'use client'`) — только там, где нужны `useState`, `useEffect`, события, `localStorage`, браузерные API.
- Размещайте директиву `'use client'` максимально глубоко в дереве компонентов, а не на layout верхнего уровня.

### 2.2. Загрузка и мутация данных

- **Загрузка** в Server Components: `async/await`, `fetch`, ORM (Prisma, Drizzle) прямо в `page.tsx`.
- `fetch`-запросы в Server Components мемоизируются по умолчанию, но не кешируются автоматически. Для кеширования используйте директиву `use cache` или оборачивайте в `<Suspense>`.
- **Streaming**: `loading.tsx` или `<Suspense fallback={...}>` для медленных секций.
- **Мутации** — Server Functions (`'use server'`). Их можно вызывать через `<form action={...}>`, `formAction` или `onClick` (из Client Components).
- Всегда проверяйте авторизацию и валидируйте входные данные внутри Server Action.

### 2.3. TypeScript и линтинг

- Используйте TypeScript (strict-режим по умолчанию в сгенерированном `tsconfig.json`).
- Включите Next.js TypeScript-плагин в редакторе: _TypeScript: Select TypeScript Version → Use Workspace Version_.
- Используйте ESLint или Biome. `create-next-app` умеет генерировать `eslint.config.mjs`.
- Для форматирования добавьте Prettier и `prettier-plugin-tailwindcss`.

### 2.4. Стилизация

- **Tailwind CSS** — дефолтный выбор `create-next-app`.
- Используйте `next/image` и `next/font` для оптимизации.
- Предпочитайте форматы `image/avif` и `image/webp`.

### 2.5. Переменные окружения

- Секреты храните в `.env.local` (не коммитится).
- Для публичных, встраиваемых в клиентский бандл переменных, используйте префикс `NEXT_PUBLIC_`.
- Помните: `NEXT_PUBLIC_` зафиксированы на момент `next build`.
- Можно загружать `.env` вне Next.js рантайма через `@next/env` (`loadEnvConfig`).

### 2.6. Маршрутизация и структура

- Используйте **import alias** `@/*` для чистых импортов.
- `src/`-директория опциональна, но помогает разделить код и конфиги.
- Используйте **route groups** `(marketing)`, `(app)`, `(auth)` для изоляции layout без влияния на URL.
- Приватные папки `_folder` позволяют colocate компоненты и утилиты рядом со страницами, не делая их публичными маршрутами.
- Используйте `loading.tsx`, `error.tsx`, `not-found.tsx` для streaming и обработки ошибок.

### 2.7. Безопасность

- Никогда не экспортируйте API-ключи и секреты в клиент.
- Проверяйте сессию в Server Actions, Route Handlers и Proxy.
- Для аутентификации используйте библиотеку (Auth.js / Better Auth / Lucia / Clerk), а не самописное решение.

---

## 3. Архитектура проекта

### 3.1. Рекомендуемая структура

```text
my-app/
├─ src/                         # опционально, но рекомендуется
│  ├─ app/
│  │  ├─ (auth)/                # группа маршрутов авторизации
│  │  │  ├─ login/page.tsx
│  │  │  ├─ register/page.tsx
│  │  │  └─ _components/        # приватные компоненты группы
│  │  │     └─ AuthForm.tsx
│  │  ├─ (main)/                # основное приложение
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  └─ dashboard/loading.tsx
│  │  ├─ api/
│  │  │  └─ auth/[...nextauth]/route.ts
│  │  ├─ layout.tsx             # корневой layout
│  │  ├─ page.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  └─ ui/                    # общие UI-примитивы
│  ├─ auth.ts                   # конфигурация Auth.js (v5)
│  ├─ lib/
│  │  ├─ db.ts                  # клиент БД
│  │  ├─ actions/               # Server Actions по доменам
│  │  │  ├─ auth.ts
│  │  │  └─ post.ts
│  │  └─ utils.ts
│  └─ proxy.ts                  # Next.js 16 proxy
├─ public/                      # статика
├─ next.config.ts
├─ tsconfig.json
├─ package.json
└─ .env.local
```

### 3.2. Особые файлы App Router

| Файл            | Назначение                                                    |
| --------------- | ------------------------------------------------------------- |
| `layout.tsx`    | Общая обёртка сегмента, сохраняет состояние между навигациями |
| `page.tsx`      | UI для конкретного маршрута                                   |
| `loading.tsx`   | Fallback для streaming всего сегмента                         |
| `error.tsx`     | Граница ошибок (error boundary)                               |
| `not-found.tsx` | UI 404                                                        |
| `route.ts`      | Server-side API endpoint (Route Handler)                      |
| `template.tsx`  | Layout, который перерисовывается при навигации                |
| `proxy.ts`      | Выполняется до рендера (Next.js 16, ранее `middleware.ts`)    |

### 3.3. Организационные паттерны

- **Colocation**: компоненты, хуки и утилиты, нужные только одной странице, держите рядом с ней, например `app/(auth)/login/_components/LoginForm.tsx`.
- **Private folders**: `_components`, `_lib` не становятся URL-сегментами.
- **Route groups**: `(auth)`, `(marketing)` позволяют применять разные layout без префикса в URL.
- **Parallel routes** (`@slot`) и **intercepted routes** (`(.)`, `(..)`) — для сложных UI (модалки, сайдбары). Используйте, когда это действительно нужно.

---

## 4. Создание страницы авторизации

### 4.1. Почему Auth.js

Документация Next.js прямо рекомендует использовать **аутентификационную библиотеку** для production, потому что она даёт:

- OAuth-провайдеры
- Управление сессиями
- CSRF-защиту
- JWT или database-сессии
- Готовые адаптеры для БД

Мы рассмотрим **Auth.js v5** (`next-auth@beta`) — текущую мажорную версию, заточенную под App Router.

### 4.2. Установка

```bash
npm install next-auth@beta
npx auth secret   # создаёт AUTH_SECRET в .env.local
```

`AUTH_SECRET` обязателен в production.

> **Примечание:** в `package.json` этого репозитория `next-auth@beta` не указан. Для примеров ниже нужно выполнить `npm install next-auth@beta` и `npx auth secret`. Если планируете Credentials-провайдер из раздела 4.8, дополнительно понадобятся `bcryptjs`, `zod` и уже настроенный клиент БД (Prisma, Drizzle и т.д.).

### 4.3. Базовая конфигурация Auth.js

Создайте `src/auth.ts`:

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google()],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        return isLoggedIn;
      }

      return true;
    },
  },
});
```

Auth.js v5 использует **inferred env variables**: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` распознаются автоматически.

### 4.4. Route Handler

`src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### 4.5. Proxy / Middleware для защиты маршрутов

В Next.js 16 файл `middleware.ts` устарел и переименован в `proxy.ts`:

```ts
// src/proxy.ts
export { auth as proxy } from "@/auth";
```

Для Next.js 14–15 используйте `src/middleware.ts`:

```ts
// src/middleware.ts
export { auth as middleware } from "@/auth";
```

Proxy/Middleware запускается до рендера. Настройте `matcher`, чтобы исключить статику, API и служебные файлы:

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.png$).*)",
  ],
};
```

### 4.6. Защита ресурсов

#### В Server Component

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <pre>{JSON.stringify(session, null, 2)}</pre>;
}
```

#### В Client Component

```tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return <button onClick={() => signOut()}>Sign out</button>;
  }

  return <button onClick={() => signIn()}>Sign in</button>;
}
```

`SessionProvider` — это клиентский контекст, поэтому его нельзя импортировать напрямую в корневой `layout.tsx`, который является Server Component. Вынесите его в отдельный клиентский файл и импортируйте в layout. Можно сразу передать начальную сессию с сервера, чтобы избежать лишнего клиентского запроса:

```tsx
// src/app/providers.tsx
"use client";

import { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
```

```tsx
// src/app/layout.tsx
import { auth } from "@/auth";
import { Providers } from "@/app/providers";
import type { ReactNode } from "react";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ru">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
```

#### В Route Handler

```ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(req.auth);
});
```

### 4.7. Кастомная страница входа

Задайте кастомный путь:

```ts
// src/auth.ts
pages: {
  signIn: '/login',
  error: '/auth/error',
}
```

#### Вариант A: Server Action + `useActionState`

`src/app/(auth)/login/actions.ts`:

```ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";

export type LoginState = { error?: string } | undefined;

// Параметр `redirectTo` нельзя собирать из недоверенного ввода
// (query string, скрытые поля формы и т.д.) без валидации.
// Разрешены только same-origin пути: начинаются с `/` и не с `//`.
function safeRedirect(redirect?: string | null) {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/dashboard";
}

export async function login(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    await signIn("credentials", {
      email,
      password,
      redirectTo: safeRedirect("/dashboard"),
    });
  } catch (error) {
    // `signIn` при успехе бросает NEXT_REDIRECT — сначала прокидываем его обратно Next.js,
    // а затем обрабатываем уже прикладные ошибки (например, AuthError).
    unstable_rethrow(error);

    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }

    // Не выбрасывайте неизвестные ошибки наружу — это может утекать детали БД/ORM.
    console.error("Login error:", error);
    return { error: "Something went wrong" };
  }
}
```

`src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      {state?.error && <p style={{ color: "red" }}>{state.error}</p>}
    </form>
  );
}
```

#### Вариант B: клиентская кнопка OAuth

> **Предупреждение:** `redirectTo` нельзя брать из query string, параметров URL или скрытых полей без валидации — это открывает возможность open-redirect атак. Используйте helper, который допускает только same-origin пути (`/...`, но не `//...` или полные URL).

```tsx
"use client";

import { signIn } from "next-auth/react";

function safeRedirect(redirect?: string | null) {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/dashboard";
}

export function GoogleSignIn({ redirectTo }: { redirectTo?: string }) {
  return (
    <button
      onClick={() => signIn("google", { redirectTo: safeRedirect(redirectTo) })}
    >
      Sign in with Google
    </button>
  );
}
```

### 4.8. Credentials-провайдер (email + пароль)

Код размещается в `src/auth.ts`. В Auth.js v5 расширение типов удобно держать в том же файле:

```ts
// src/auth.ts
import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
  }

  interface Session {
    user: { id: string; role?: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = schema.safeParse(credentials);
        if (!parsed.success) return null;

        // db — ваш клиент БД, например Prisma/Drizzle
        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      if (typeof token.role === "string") {
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

> **Важно:** `bcryptjs` — runtime-зависимость (не `devDependencies`), которая выполняет хеширование в рантайме. Для production рассмотрите `argon2` или нативный `crypto.scrypt`.

### 4.9. Расширение типов внутри `auth.ts`

Auth.js v5 рекомендует расширять типы в том же файле, где находится конфигурация — `src/auth.ts`. Module augmentation `declare module "next-auth"` и `declare module "next-auth/jwt"` (см. листинг `src/auth.ts` в разделе 4.8) добавляет поля `id` и `role` к `User`, `Session` и `JWT`.

Отдельный `next-auth.d.ts` не нужен: во-первых, `tsconfig.json` часто не включает `.d.ts` файлы, во-вторых, расширение внутри `auth.ts` гарантирует, что TypeScript увидит изменения везде, где используется `auth()`, `useSession()` и `SessionProvider`.

Важно: файл с расширением должен быть включён в `tsconfig.json` (`"include": ["**/*.ts", "**/*.tsx"]`), иначе TypeScript может его не подхватить.

### 4.10. Чек-лист безопасности авторизации

- `AUTH_SECRET` установлен и не пустой в production.
- Пароли хешируются (`bcryptjs` / `argon2`), а не хранятся plaintext.
- `.env.local` добавлен в `.gitignore`.
- `NEXT_PUBLIC_` используется только для публичных переменных.
- Все Server Actions / Route Handler проверяют `auth()` / `req.auth`.
- Для production по возможности используйте OAuth / Passkey вместо Credentials.
- Защищайте маршруты на уровне Proxy/Middleware, чтобы не показывать приватный UI неавторизованным пользователям.

### 4.11. Прерывания авторизации в Next.js 16 (experimental)

Next.js 16 предлагает экспериментальные механизмы `unauthorized()` (401) и `forbidden()` (403). Чтобы их использовать, включите `experimental.authInterrupts` в `next.config.ts`.

> **Важно:** `authInterrupts` — экспериментальный API и не должен быть единственной границей авторизации. Продолжайте проверять сессию через `auth()`, `proxy.ts` и внутри Server Actions / Route Handlers.

Рядом с защищёнными маршрутами создайте файлы `unauthorized.tsx` / `forbidden.tsx`. Next.js ищет ближайший файл с таким именем в дереве сегментов маршрута; если в текущем сегменте файла нет, используется корневой fallback. Эти файлы отрисуются автоматически, когда функция бросает соответствующее исключение.

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
```

```tsx
// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import { unauthorized } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    unauthorized();
  }

  return <h1>Dashboard</h1>;
}
```

```tsx
// src/app/admin/page.tsx
import { auth } from "@/auth";
import { forbidden, unauthorized } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  // Сначала проверяем аутентификацию (401), затем — авторизацию (403).
  if (!session) {
    unauthorized();
  }

  if (session.user?.role !== "admin") {
    forbidden();
  }

  return <h1>Admin</h1>;
}
```

```tsx
// src/app/unauthorized.tsx
import Link from "next/link";

export default function Unauthorized() {
  return (
    <main>
      <h1>401 — Не авторизован</h1>
      <p>
        Пожалуйста, <Link href="/login">войдите</Link>, чтобы продолжить.
      </p>
    </main>
  );
}
```

```tsx
// src/app/forbidden.tsx
export default function Forbidden() {
  return (
    <main>
      <h1>403 — Доступ запрещён</h1>
      <p>У вас недостаточно прав для просмотра этой страницы.</p>
    </main>
  );
}
```

> **Важно:** `unauthorized()` и `forbidden()` бросают ошибки. Обычно их не нужно оборачивать в `try/catch` — пусть исключение дойдёт до Next.js, чтобы отрисовался `unauthorized.tsx` / `forbidden.tsx`. `unstable_rethrow` нужен только если вызов находится внутри существующего `try/catch` (например, рядом с `signIn` в Server Action): тогда первым делом вызовите `unstable_rethrow(error)`, иначе Next.js не сможет поймать прерывание. Ссылки на официальную документацию — в разделе 7 (Источники).

---

## 5. Итоговые рекомендации

1. **Инициализация**: `npx create-next-app@latest` с дефолтами (`--yes` или интерактивный режим). Это даёт TypeScript, ESLint, Tailwind, App Router, Turbopack и `@/*`.
2. **Архитектура**: стройте на App Router, Server Components, Server Actions и streaming. Используйте `src/`, группы маршрутов `(auth)`/`(main)`, private folders `_components` и shared `components/ui` + `lib/`.
3. **Авторизация**: используйте **Auth.js v5** — единый `auth.ts` (включая расширение типов `declare module`), Route Handler `app/api/auth/[...nextauth]/route.ts`, `proxy.ts` (или `middleware.ts` для старых версий), `auth()` для защиты и `pages: { signIn: '/login' }` для кастомной страницы входа.
4. **Credentials**: только если действительно нужны email+пароль. Хешируйте пароли, валидируйте `Zod`, расширяйте JWT/Session типы.
5. **Правило большого пальца**: делайте как можно больше на сервере (Server Components, Server Actions), а интерактивность выносьте в минимальные Client Components.

---

## 6. Как встроить Next.js в существующий проект (например, agent-roster)

`create-next-app` — это скелетон для **нового** проекта. Он не умеет безопасно инжектиться в непустую директорию: CLI либо откажется работать, либо создаст отдельную папку `my-app` со своим `package.json`, и придётся мёржить конфиги вручную.

### Рекомендуемый путь

**Цель:** сохранить текущий репозиторий, его git-историю и агентские настройки (`AGENTS.md`, `agents/`, `config/`, `scripts/`, `tests/`), но добавить Next.js-приложение.

#### Вариант A: ручная установка прямо в корень

```bash
npm i next@latest react@latest react-dom@latest
npm i -D typescript @types/node @types/react @types/react-dom \
  eslint eslint-config-next tailwindcss postcss autoprefixer
```

Добавить в `package.json` скрипты:

```json
{
  "name": "agent-roster-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "sync:agents": "node scripts/sync-agents.mjs",
    "check:agents": "node scripts/sync-agents.mjs --check",
    "validate:agents": "node scripts/validate-agents.mjs",
    "doctor:agents": "node scripts/doctor-agents.mjs",
    "test:agents": "node --test"
  }
}
```

Создать минимальный набор файлов:

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`
- `public/`
- `.env.local`
- обновить `.gitignore`:
  ```
  .next
  next-env.d.ts
  node_modules
  .env*.local
  ```

Плюс: ничего никуда переносить не нужно, агентские скрипты остаются на месте.

#### Вариант B: использовать `create-next-app` как генератор в папке `/tmp`

```bash
npx create-next-app@latest /tmp/nextjs-scaffold --yes --typescript --tailwind --eslint --app
```

Затем скопировать из `/tmp/nextjs-scaffold` в текущий репозиторий:

- `app/`
- `public/`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`
- зависимости и скрипты из `package.json` — **смержить** с существующим `package.json`, не заменять его.

После копирования удалить `/tmp/nextjs-scaffold`.

#### Вариант C: монорепозиторий

Создать Next.js в подпапке, например `apps/web` или `web/`, и настроить workspaces (pnpm/yarn/npm). Корень оставить под агентские настройки. Это удобно, если планируется несколько пакетов/сервисов, но для одного веб-приложения — избыточно.

### Что делать с `create-next-app my-app`?

Если запустить `npx create-next-app@latest my-app` и потом переносить туда агентские файлы, получится **переезд в новый репозиторий**. Это теряет текущую git-историю (если не делать `git mv`) и требует ручного слияния. Вместо этого проще:

- либо установить Next.js в корень текущего репозитория (Вариант A),
- либо сгенерировать скелет в `/tmp` и перенести только Next.js-файлы (Вариант B).

### Что не забыть

- Переименовать `name` в `package.json`, если сейчас он `next-auth`, чтобы не конфликтовать с зависимостью `next-auth` при `npm install next-auth`.
- `AGENTS.md`, `.claude/`, `.devin/`, `.cursor/`, `.codex/`, `agents/`, `config/`, `scripts/`, `tests/` оставить в корне — они работают на уровне всего проекта.
- `.gitignore` дополнить `.next`, `next-env.d.ts`, `.env*.local`.
- Если нужна авторизация, настроить `next-auth@beta` согласно разделу 4.

---

## 7. Источники

- Next.js — Installation: https://nextjs.org/docs/app/getting-started/installation
- Next.js — `create-next-app` CLI: https://nextjs.org/docs/app/api-reference/cli/create-next-app
- Next.js — Project structure: https://nextjs.org/docs/app/getting-started/project-structure
- Next.js — Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js — Fetching data: https://nextjs.org/docs/app/getting-started/fetching-data
- Next.js — Mutating data / Server Actions: https://nextjs.org/docs/app/getting-started/mutating-data
- Next.js — Streaming: https://nextjs.org/docs/app/guides/streaming
- Next.js — Environment variables: https://nextjs.org/docs/app/guides/environment-variables
- Next.js — Authentication guide: https://nextjs.org/docs/app/guides/authentication
- Next.js — `proxy.ts` reference: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Next.js Learn — Dashboard app structure: https://nextjs.org/learn/dashboard-app/getting-started
- Auth.js — Installation for Next.js: https://authjs.dev/getting-started/installation?framework=next.js
- Auth.js — Migrating to v5: https://authjs.dev/getting-started/migrating-to-v5
- Auth.js — Protecting resources: https://authjs.dev/getting-started/session-management/protecting
- Auth.js — Custom pages: https://authjs.dev/getting-started/session-management/custom-pages
- Auth.js — Credentials provider: https://authjs.dev/getting-started/providers/credentials
- Next.js — Proxy guide: https://nextjs.org/docs/app/getting-started/proxy
- Next.js — `unstable_rethrow`: https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow
- Next.js — `authInterrupts`: https://nextjs.org/docs/app/api-reference/config/next-config-js/authInterrupts
- Next.js — `unauthorized`: https://nextjs.org/docs/app/api-reference/functions/unauthorized
- Next.js — `unauthorized.js` file: https://nextjs.org/docs/app/api-reference/file-conventions/unauthorized
- Next.js — `forbidden`: https://nextjs.org/docs/app/api-reference/functions/forbidden
- Next.js — `forbidden.js` file: https://nextjs.org/docs/app/api-reference/file-conventions/forbidden
- Auth.js — Session management: https://authjs.dev/getting-started/session-management
- Auth.js — Login: https://authjs.dev/getting-started/session-management/login
- Auth.js — Get Session: https://authjs.dev/getting-started/session-management/get-session
- Auth.js — TypeScript: https://authjs.dev/getting-started/typescript
- Auth.js — Next.js reference: https://authjs.dev/reference/nextjs
