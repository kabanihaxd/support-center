import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, required, validate } from '@angular/forms/signals';
import { AuthService } from '@core/services/auth.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { Avatar } from '@shared/components/avatar/avatar';
import { FieldErrors } from '@shared/components/field-errors/field-errors';
import { Icon } from '@shared/components/icon/icon';
import { ROLE_LABELS } from '@shared/models';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { TicketDetailsStore } from './ticket-details.store';

interface CommentModel {
  body: string;
  internal: boolean;
}

/** Переписка по тикету + форма нового комментария */
@Component({
  selector: 'app-ticket-comments',
  imports: [DatePipe, Avatar, Icon, FormField, FormRoot, FieldErrors, RelativeTimePipe],
  templateUrl: './ticket-comments.html',
  styleUrl: './ticket-comments.css',
})
export class TicketComments {
  protected readonly store = inject(TicketDetailsStore);
  protected readonly users = inject(UserDirectory);
  protected readonly auth = inject(AuthService);

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly canInternal = computed(() => this.auth.can('comment.internal'));
  protected readonly closed = computed(() => this.store.ticket()?.status === 'closed');

  protected readonly model = signal<CommentModel>({ body: '', internal: false });
  protected readonly form = form(
    this.model,
    (p) => {
      required(p.body, { message: 'Write a message first' });
      validate(p.body, ({ value }) => (value().trim() ? undefined : { kind: 'blank', message: 'Write a message first' }));
      maxLength(p.body, 2000, { message: 'Comment must be at most 2000 characters' });
    },
    {
      submission: {
        action: async () => {
          const { body, internal } = this.model();
          const ok = await this.store.addComment(body, internal && this.canInternal());
          if (ok) this.form().reset({ body: '', internal: false });
          return undefined;
        },
      },
    },
  );

  protected authorName(id: string): string {
    return this.users.name(id);
  }

  protected authorRole(id: string): string {
    const user = this.users.byId().get(id);
    return user ? ROLE_LABELS[user.role] : '';
  }
}
