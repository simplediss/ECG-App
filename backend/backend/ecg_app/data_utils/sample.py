from pathlib import Path


class SampleHeader:
    def __init__(self, header_data: list[str]):
        self.header_data = header_data

    def __str__(self) -> str:
        return '\n'.join(self.header_data)
    
    def __len__(self) -> int:
        return int(self.header_data[0].split(' ')[3])
    
    @property
    def age(self) -> int | None:
        try:
            age = int(self.header_data[13][6:])
            return age if age > 0 else None
        except ValueError:
            return None
    
    @property
    def gender(self) -> str | None:
        gender = self.header_data[14][6:]
        return gender if gender in ['Male', 'Female'] else None
    
    @property
    def codes(self) -> list[int]:
        codes_str = self.header_data[15][5:]
        return [int(code) for code in codes_str.split(',')]


def load_header(path: Path) -> SampleHeader:
    """Load a header .hea file into a custom SampleHeader object."""
    hea_path = path if path.suffix == '.hea' else path.with_suffix('.hea')
    with open(hea_path, 'r') as f:
        lines = [l.strip() for l in f.readlines()]
    return SampleHeader(lines)


def get_samples_paths(data_dir: Path) -> list[Path]:
    """Get a list of all sample paths in the specified data directory."""
    samples_paths = []
    dirs = [dir for dir in data_dir.iterdir() if dir.is_dir()]
    for ds_path in dirs:
        ds_samples_paths = sorted(set([i.with_suffix('') for i in ds_path.iterdir()]))
        samples_paths += list(ds_samples_paths)
    return samples_paths
