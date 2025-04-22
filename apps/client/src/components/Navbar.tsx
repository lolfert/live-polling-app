import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Github, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const menuLinks = [
        { label: "Home", link: "/" },
        { label: "About", link: "/about" },
];

function Navbar() {

        const { theme, setTheme } = useTheme();

        return (
                <nav className="flex items-center justify-between p-2 bg-background border-b border-border">
                        <div className="flex items-center gap-4">
                                <NavigationMenu>
                                        <NavigationMenuList>
                                                {menuLinks.map((item) => (
                                                        <NavigationMenuItem key={item.label}>
                                                                <NavigationMenuLink href={item.link}>
                                                                        {item.label}
                                                                </NavigationMenuLink>
                                                        </NavigationMenuItem>
                                                ))}
                                        </NavigationMenuList>
                                </NavigationMenu>
                        </div>
                        <div className="flex items-center space-x-2">
                                <Button asChild variant="ghost" size="icon">
                                        <a href="https://github.com/lolfert/poll-app" target="_blank" rel="noopener noreferrer">
                                                <Github className="h-5 w-5" />
                                        </a>
                                </Button>
                                <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                                >
                                        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                                </Button>
                        </div>
                </nav>
        );
}

export default Navbar;