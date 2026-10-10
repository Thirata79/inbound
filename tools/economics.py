"""Zen Meditation Experience: 1人あたり・月次の収支モデル。

使い方:
    python3 tools/economics.py                  # v12の前提（OTAにも決済手数料を計上）
    python3 tools/economics.py --no-ota-card    # OTA分は決済手数料なし（OTAが代金を回収する前提）
    python3 tools/economics.py --no-ota-card --ota-rate 0.22 --dojo-fee 1000   # 2026-10-10時点の前提
"""

import argparse

PRICE = 9000
OTA_RATE = 0.30
CARD_RATE = 0.036
# Robertへの支払い：累進（超えた分のみ上の単価）
ROBERT_TIERS = [(100, 3500), (150, 3750), (None, 4000)]
DOJO_FEE = 0  # 会場（法人）への1人あたりの支払い。--dojo-fee で変える


def robert_payout(people: int) -> int:
    total, prev = 0, 0
    for cap, rate in ROBERT_TIERS:
        upper = people if cap is None else min(people, cap)
        if upper > prev:
            total += (upper - prev) * rate
        if cap is None or people <= cap:
            break
        prev = cap
    return total


def fees(people: int, ota_share: float, ota_card: bool) -> float:
    ota = people * ota_share
    direct = people - ota
    card_base = people if ota_card else direct
    return ota * PRICE * OTA_RATE + card_base * PRICE * CARD_RATE + people * DOJO_FEE


def monthly(people: int, ota_share: float = 0.5, ota_card: bool = True) -> dict:
    revenue = people * PRICE
    robert = robert_payout(people)
    fee = fees(people, ota_share, ota_card)
    return {"people": people, "revenue": revenue, "robert": robert,
            "fees": fee, "net": revenue - robert - fee}


def people_needed(target: int, ota_share: float, ota_card: bool) -> int:
    n = 1
    while monthly(n, ota_share, ota_card)["net"] < target:
        n += 1
    return n


def main() -> None:
    global OTA_RATE, DOJO_FEE
    p = argparse.ArgumentParser()
    p.add_argument("--no-ota-card", action="store_true",
                   help="OTA経由の予約には決済手数料をかけない")
    p.add_argument("--target", type=int, default=200_000,
                   help="月の目標残額（円）")
    p.add_argument("--ota-rate", type=float, default=OTA_RATE,
                   help="OTAの手数料率（v12は0.30。実際は0.20〜0.30）")
    p.add_argument("--dojo-fee", type=int, default=DOJO_FEE,
                   help="会場への1人あたりの支払い（円）")
    args = p.parse_args()
    ota_card = not args.no_ota_card
    OTA_RATE, DOJO_FEE = args.ota_rate, args.dojo_fee

    print(f"前提：OTA手数料 {OTA_RATE:.0%}、会場 {DOJO_FEE:,}円/人、OTA分の決済手数料 {'あり' if ota_card else 'なし'}")
    print("1人あたりの残額（Robert 3,500円の帯）")
    for label, share in [("直販のみ", 0.0), ("OTAのみ", 1.0), ("半々", 0.5)]:
        print(f"  {label}: {monthly(1, share, ota_card)['net']:,.0f}円")

    print("\n月次（OTA半々）")
    print(f"  {'人数':>4} {'月商':>9} {'Robert':>9} {'手数料等':>9} {'残額':>9}")
    for n in (50, 80, 100, 150, 200):
        m = monthly(n, 0.5, ota_card)
        print(f"  {n:>4} {m['revenue']:>9,} {m['robert']:>9,} "
              f"{m['fees']:>9,.0f} {m['net']:>9,.0f}")

    print(f"\n月{args.target:,}円に必要な人数")
    for label, share in [("直販のみ", 0.0), ("半々", 0.5), ("OTA7割", 0.7),
                         ("OTAのみ", 1.0)]:
        print(f"  {label}: {people_needed(args.target, share, ota_card)}人")


if __name__ == "__main__":
    main()
