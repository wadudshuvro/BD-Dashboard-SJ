import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance } from 'tippy.js';
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import MentionList, { MentionListRef } from './MentionList';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

export const MentionSuggestion = (teamMembers: TeamMember[]): Omit<SuggestionOptions, 'editor'> => ({
  items: ({ query }: { query: string }) => {
    return teamMembers
      .filter((item) =>
        item.name.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer<MentionListRef> | null = null;
    let popup: Instance[] | null = null;

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: SuggestionProps) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }

        return component?.ref?.onKeyDown(props) ?? false;
      },

      onExit() {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
});
