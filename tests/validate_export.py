"""Validación local del contrato observado; NO es verificación normativa.
Uso: python tests/validate_export.py archivo.json [otros.json]
Sin librerías de terceros ni servicios externos.
"""
import json
import math
import pathlib
import sys


def fail(msg):
    raise ValueError(msg)


def n(obj, label):
    if isinstance(obj, bool) or not isinstance(obj, (int, float)) or not math.isfinite(obj):
        fail(f"{label}: se esperaba número finito")
    return obj


def eq(actual, expected, label):
    if not math.isclose(n(actual, label), n(expected, label+" esperado"), rel_tol=1e-10, abs_tol=1e-8):
        fail(f"{label}: no coincide ({actual} != {expected})")


def validate(d):
    if d.get("schemaVersion") != "0.4" or d.get("preliminary") is not True:
        fail("schemaVersion no soportada o falta marca preliminary=true")
    if d.get("units") != {"force": "kgf"}:
        fail("unidades incorrectas")
    typ=d.get("article")
    standards={"7.2-7.3":"NCh2369:2025","87":"CNE Anexo Técnico Requisitos Sísmicos enero 2025","88":"CNE Anexo Técnico Requisitos Sísmicos enero 2025"}
    if typ not in standards or d.get("standard") != standards[typ]:
        fail("artículo y norma incompatibles")
    required={"7.2-7.3":["category","seismic_zone","soil","Rp","height_m","level_m","anchor_route"],"87":["IE","frequency_Hz","vertical_frequency_check","location","location_factors","floor_verified","anchor_type"],"88":["IE","R_structure","R_anchor_reference","Sa_over_g","A0_g","damping_pct","spectrum_mode","location","location_factors","floor_verified","vertical_model","anchor_type"]}
    inp=d["inputs"]
    for field in required[typ]+["weight_kgf"]:
        if field not in inp: fail(f"Falta inputs.{field}")
    w=n(inp["weight_kgf"],"weight_kgf")
    if w<=0: fail("Peso debe ser positivo")
    if typ=="7.2-7.3":
        if n(inp["height_m"],"height_m")<=0 or not 0<=n(inp["level_m"],"level_m")<=inp["height_m"]: fail("H/Zk inválidos")
        if inp["anchor_route"] not in ["duct","brittle","justified"]: fail("anchor_route inválido")
    if typ=="87":
        if any(n(inp["frequency_Hz"][v],"frequency")<20 for v in ["X","Y"]): fail("Art.87 frecuencia horizontal <20 Hz")
    if typ in ["87","88"]:
        if inp["location"] not in ["ground","floor"]: fail("ubicación fuera de alcance")
        if inp["location"]=="floor" and inp["floor_verified"] is not True: fail("piso sin confirmar")
        exp_h,exp_v=(1.5,1.4) if inp["location"]=="floor" else (1,1)
        eq(inp["location_factors"]["Kh"],exp_h,"Kh ubicación")
        eq(inp["location_factors"]["Kv"],exp_v,"Kv ubicación")
    cs=d["coefficients"]["structure"]
    mult=d["coefficients"]["anchor_multiplier"]
    ds=d["seismic_demands"]["structure"]
    da=d["seismic_demands"]["anchors"]
    for key,coef in [("Ex","X"),("Ey","Y"),("Ez_magnitude","vertical")]:
        if n(cs[coef],coef)<0 or n(ds[key],key)<0 or n(da[key],key)<0: fail("Demanda negativa")
        eq(ds[key],w*cs[coef],"structure."+key)
        eq(da[key],ds[key]*mult["vertical" if key=="Ez_magnitude" else "horizontal"],"anchors."+key)
    eq(mult["vertical"],1,"factor vertical")
    expected={"87":1.25,"88":1.5}
    if typ in expected: eq(mult["horizontal"], expected[typ],"multiplicador por artículo")
    if typ=="7.2-7.3":
        rp=n(inp["Rp"],"Rp")
        eq(mult["horizontal"],rp if inp["anchor_route"]=="brittle" else 0.7*rp if inp["anchor_route"]=="duct" else 1,"multiplicador NCh2369")
    if not isinstance(d.get("notes"),list) or not isinstance(d.get("limitations"),list): fail("notes/limitations inválidos")
    return "VÁLIDO ESTRUCTURALMENTE (PRELIMINAR; SIN AUDITORÍA NORMATIVA)"


def no_duplicates(pairs):
    result={}
    for k,v in pairs:
        if k in result: fail(f"Campo JSON duplicado: {k}")
        result[k]=v
    return result


def main():
    if len(sys.argv)<2: sys.exit("Uso: python tests/validate_export.py archivo.json [otros.json]")
    code=0
    for name in sys.argv[1:]:
        try:
            file=pathlib.Path(name)
            if file.stat().st_size>2_000_000: fail("Archivo excede 2 MB")
            d=json.loads(file.read_text(encoding="utf-8"),parse_constant=lambda x: fail("Número no finito: "+x),object_pairs_hook=no_duplicates)
            print(name,":",validate(d))
        except (OSError,ValueError,KeyError,TypeError,json.JSONDecodeError) as e:
            print(name,": ERROR:",e)
            code=1
    sys.exit(code)

if __name__=="__main__": main()
