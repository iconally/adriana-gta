// =====================================================================
//  GTA - Garsioji Talentingoji Adriana: nustatymai
// =====================================================================
//  Supabase "anon public" raktas yra viešas pagal paskirtį (jis matomas
//  kiekvienam puslapio lankytojui), todėl jį galima laikyti GitHub.
//  NIEKADA nedėk čia "service_role" rakto.
//
//  Kol SUPABASE_URL tuščias, žaidimas veikia VIETINIU režimu:
//  ekranas ir "telefonai" susikalba tik tos pačios naršyklės skirtukuose.
// =====================================================================

window.AGTA_CONFIG = {
  // Supabase -> Project Settings -> API -> Project URL
  SUPABASE_URL: 'https://mhqehckpylzfsgzewahl.supabase.co',

  // Supabase -> Project Settings -> API -> anon public
  SUPABASE_ANON_KEY: 'sb_publishable_f0M9k3fihUGBvv2y9hqd6g_3fGyydi6',

  // Jei tuščia, telefono nuoroda (QR) sudaroma iš ekrano adreso.
  // Pvz. 'https://iconally.github.io/adriana-gta/'
  PUBLIC_BASE_URL: '',
};
