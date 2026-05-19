from .ch_absolute_bayes import run as run_ch_absolute_bayes
from .ch_changepoint_bayes import run as run_ch_changepoint_bayes
from .ch_countries_trend import run as run_ch_countries_trend
from .ch_forecast_bayes import run as run_ch_forecast_bayes
from .ch_gap_bayes import run as run_ch_gap_bayes
from .ch_genre_bayes import run as run_ch_genre_bayes
from .ch_genremix_bayes import run as run_ch_genremix_bayes
from .ch_weekly_bayes import run as run_ch_weekly_bayes

RUNNERS: list[tuple[str, object]] = [
    ("ch_genre_bayes", run_ch_genre_bayes),
    ("ch_genremix_bayes", run_ch_genremix_bayes),
    ("ch_changepoint_bayes", run_ch_changepoint_bayes),
    ("ch_absolute_bayes", run_ch_absolute_bayes),
    ("ch_gap_bayes", run_ch_gap_bayes),
    ("ch_weekly_bayes", run_ch_weekly_bayes),
    ("ch_forecast_bayes", run_ch_forecast_bayes),
    ("ch_countries_trend", run_ch_countries_trend),
]

ALL = [fn for _, fn in RUNNERS]
