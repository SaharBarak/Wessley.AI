import { ContentType } from "@/types"
import {
  IconMessage,
  IconSearch,
  IconCompass,
  IconPhoto,
  IconShoppingCart,
  IconSettings,
  IconDashboard,
  IconCar
} from "@tabler/icons-react"
import { FC } from "react"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"
import { useSearch } from "../search/search-provider"

export const SIDEBAR_ICON_SIZE = 22

interface SidebarSwitcherProps {
  onMainViewChange: (view: ContentType) => void
  currentView: ContentType
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onMainViewChange,
  currentView
}) => {
  const { open } = useSearch()
  
  return (
    <div className="flex flex-col justify-between border-r-2 border-border w-[60px] flex-shrink-0 h-full" style={{backgroundColor: '#090909'}}>
      <div className="flex flex-col">
        {/* Wessley Logo */}
        <div className="pt-4 pb-4">
          <img 
            src="/wessley_thumb_chat.svg" 
            alt="Wessley" 
            className="w-8 h-8 mx-auto"
          />
        </div>

        <div className="flex flex-col gap-1 px-1">
        <SidebarSwitchItem
          icon={<IconCar size={SIDEBAR_ICON_SIZE} />}
          contentType="chat"
          onContentTypeChange={onMainViewChange}
          isActive={currentView === "chat"}
        />

        {/* Special Search Trigger - Opens global search dialog */}
        <WithTooltip
          display={<div>Search (⌘K)</div>}
          trigger={
            <button
              className="flex h-12 w-12 items-center justify-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={open}
            >
              <IconSearch size={SIDEBAR_ICON_SIZE} />
            </button>
          }
        />

        <SidebarSwitchItem
          icon={<IconCompass size={SIDEBAR_ICON_SIZE} />}
          contentType="explore"
          onContentTypeChange={onMainViewChange}
          isActive={currentView === "explore"}
        />

        <SidebarSwitchItem
          icon={<IconPhoto size={SIDEBAR_ICON_SIZE} />}
          contentType="gallery"
          onContentTypeChange={onMainViewChange}
          isActive={currentView === "gallery"}
        />


        <SidebarSwitchItem
          icon={<IconShoppingCart size={SIDEBAR_ICON_SIZE} />}
          contentType="marketplace"
          onContentTypeChange={onMainViewChange}
          isActive={currentView === "marketplace"}
        />

        <SidebarSwitchItem
          icon={<IconSettings size={SIDEBAR_ICON_SIZE} />}
          contentType="auto-tuning"
          onContentTypeChange={onMainViewChange}
          isActive={currentView === "auto-tuning"}
        />
        </div>
      </div>

      <div className="flex flex-col items-center pb-4">
        <ProfileSettings />
      </div>
    </div>
  )
}
