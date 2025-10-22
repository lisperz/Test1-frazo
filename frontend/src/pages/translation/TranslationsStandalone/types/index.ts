export interface Translation {
  id: string;
  name: string;
  created: string;
  images: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  section: string;
}
