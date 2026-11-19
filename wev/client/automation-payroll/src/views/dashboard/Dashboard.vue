<script></script>
<template>
  <div class="bg-gray-200 min-h-screen">
    <v-app>
      <div class="flex items-center justify-center h-screen py-2 px-4">
        <v-card class="w-auto">
          <div class="p-4 w-100">
            <v-text-field
              :rules="rules"

              label="Main input"
              class="h-10 p-2"
            ></v-text-field>
          </div>
        </v-card>
      </div>
    </v-app>
  </div>
</template>
