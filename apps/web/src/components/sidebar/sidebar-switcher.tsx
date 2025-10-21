import { ContentType } from "@/types"
import {
  IconMessage,
  IconPhoto,
  IconCurrencyDollar,
  IconShoppingCart,
  IconSettings,
  IconDashboard,
  IconUser
} from "@tabler/icons-react"
import { FC } from "react"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"

export const SIDEBAR_ICON_SIZE = 28

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange
}) => {
  return (
    <div className="flex flex-col justify-between border-r-2 pb-5 bg-background">
      {/* Wessley Logo */}
      <div className="pt-3 pb-2">
        <img 
          src="/wessley_thumb_chat.png" 
          alt="Wessley" 
          className="w-10 h-10 mx-auto"
        />
      </div>

      <TabsList className="bg-background grid h-[440px] grid-rows-6">
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} />}
          contentType="chat"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconPhoto size={SIDEBAR_ICON_SIZE} />}
          contentType="gallery"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconCurrencyDollar size={SIDEBAR_ICON_SIZE} />}
          contentType="budget"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconShoppingCart size={SIDEBAR_ICON_SIZE} />}
          contentType="marketplace"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconSettings size={SIDEBAR_ICON_SIZE} />}
          contentType="auto-tuning"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconDashboard size={SIDEBAR_ICON_SIZE} />}
          contentType="dashboard"
          onContentTypeChange={onContentTypeChange}
        />
      </TabsList>

      <div className="flex flex-col items-center space-y-4">
        <WithTooltip
          display={<div>Profile</div>}
          trigger={
            <button className="p-2 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <IconUser size={24} />
            </button>
          }
        />
      </div>
    </div>
  )
}
