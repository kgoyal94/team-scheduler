/**
 * Business / settings persistence layer (Phase 2 — Supabase).
 *
 * The DB stores settings as a JSONB blob in businesses.settings.
 * We load the single business row and return its settings; saving writes
 * the whole blob back.
 *
 * businessId is passed in (resolved once during bootstrap) so this
 * module stays stateless.
 */
import { Settings } from "../domain/types";
import { supabase } from "./supabase";

/** Load settings from the business row. Returns null if the row is missing. */
export async function loadSettings(businessId: string): Promise<Settings | null> {
  const { data, error } = await supabase()
    .from("businesses")
    .select("settings")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    console.error("[settings] loadSettings error", error);
    return null;
  }
  return (data?.settings as Settings) ?? null;
}

/**
 * Persist the whole Settings object back to businesses.settings.
 * Call this whenever the user changes any setting (debounce in the component
 * if needed, but for now we write on every change).
 */
export async function saveSettings(
  businessId: string,
  settings: Settings
): Promise<void> {
  const { error } = await supabase()
    .from("businesses")
    .update({ settings })
    .eq("id", businessId);

  if (error) {
    console.error("[settings] saveSettings error", error);
  }
}

/** Create the initial business row and return its UUID. */
export async function createBusiness(
  name: string,
  settings: Settings
): Promise<string | null> {
  const { data, error } = await supabase()
    .from("businesses")
    .insert({ name, settings })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[settings] createBusiness error", error);
    return null;
  }
  return data.id as string;
}

/** Return the id of the first (and only, in MVP) business, or null. */
export async function getBusinessId(): Promise<string | null> {
  // .maybeSingle() returns null data (without an error) when no rows exist;
  // .single() would error on an empty result set.
  const { data, error } = await supabase()
    .from("businesses")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[settings] getBusinessId error", error);
    return null;
  }
  return (data?.id as string) ?? null;
}
