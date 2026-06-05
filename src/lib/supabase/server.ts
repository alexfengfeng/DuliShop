import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies; middleware/actions can.
        }
      },
    },
  });
}

export async function getSupabaseUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getAdminUser() {
  const authUser = await getSupabaseUser();
  if (!authUser?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: { store: true },
  });

  if (!user) return null;
  if (!user.supabaseUserId && authUser.id) {
    return prisma.user.update({
      where: { id: user.id },
      data: { supabaseUserId: authUser.id },
      include: { store: true },
    });
  }

  return user;
}
