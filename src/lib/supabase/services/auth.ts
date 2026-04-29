import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/domain";

const mapProfile = (row: {
  id: string;
  email: string;
  full_name: string;
  role: string;
  age: number | null;
  phone: string | null;
  avatar_path: string | null;
}): Profile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role as UserRole,
  age: row.age,
  phone: row.phone,
  avatarPath: row.avatar_path,
});

export const getSession = async (): Promise<Session | null> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
};

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, age, phone, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfile(data) : null;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("email not confirmed")) {
      throw new Error("Please confirm your email before logging in.");
    }
    if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
      throw new Error("Invalid credentials.");
    }

    throw error;
  }

  if (!data.session) {
    const session = await getSession();
    if (!session) {
      throw new Error("Authentication session missing. Please try again.");
    }
  }
};

export const signUp = async (input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        role: input.role,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data.session ?? null;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

export const updateProfile = async (input: {
  fullName: string;
  age: number | null;
  phone: string | null;
}) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("No authenticated user");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      age: input.age,
      phone: input.phone,
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }
};
