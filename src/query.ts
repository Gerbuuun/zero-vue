// based on https://github.com/rocicorp/mono/tree/main/packages/zero-solid

import type { AdvancedQuery, HumanReadable, Query } from '@rocicorp/zero/advanced'
// Schema is used internally in the rocicorp monorepo, only the react namespace exports it
import type { Schema } from '@rocicorp/zero/react'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

import { computed, getCurrentInstance, isRef, onUnmounted, shallowRef, toValue, watch } from 'vue'
import { type QueryResultDetails, vueViewFactory } from './view'

interface QueryResult<TReturn> {
  data: ComputedRef<HumanReadable<TReturn>>
  status: ComputedRef<QueryResultDetails['type']>
}

export function useQuery<
  TSchema extends Schema,
  TTable extends keyof TSchema['tables'] & string,
  TReturn,
>(_query: MaybeRefOrGetter<Query<TSchema, TTable, TReturn>>): QueryResult<TReturn> {
  const query = toValue(_query) as AdvancedQuery<TSchema, TTable, TReturn>
  const view = shallowRef(query.materialize(vueViewFactory))

  if (isRef(_query) || _query instanceof Function) {
    watch(_query, (query) => {
      view.value.destroy()
      view.value = (query as AdvancedQuery<TSchema, TTable, TReturn>).materialize(vueViewFactory)
    })
  }

  if (getCurrentInstance()) {
    onUnmounted(() => view.value.destroy())
  }

  return {
    data: computed(() => view.value.data),
    status: computed(() => view.value.resultDetails.type),
  }
}
