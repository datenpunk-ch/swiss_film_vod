from .ch_intensity import run as run_ch_intensity
from .ch_success_bayes import run as run_ch_success_bayes
from .ch_supply_demand import run as run_ch_supply_demand
from .cinema_season import run as run_cinema_season
from .market_overview import run as run_market_overview

ALL = [
    run_market_overview,
    run_ch_supply_demand,
    run_ch_success_bayes,
    run_ch_intensity,
    run_cinema_season,
]
