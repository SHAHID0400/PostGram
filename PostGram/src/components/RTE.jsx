import React from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Controller } from "react-hook-form";
const RTE = ({ name, control, label, defaultValue = "" }) => {
  return (
    //    <Editor
    //    initialValue='default value'
    //    init={
    //     {branding:false,
    //      height : 500,
    //      menubar:true,
    //      plugins:[
    //         'advlist autolink lists link image charmap print preview anchor',
    //         'searchreplace visualblocks code fullscreen',
    //         'insertdatetime media table paste code help wordcount'
    //      ],
    //      toolbar:
    //         'undo redo | formatselect | bold italic backcolor | \
    //         alignleft aligncenter alignright alignjustify | \
    //         bullist numlist outdent indent | removeformat | help '
    //     }

    //    }
    //    />
    <div className="w-full">
      {label && <label className="inline-block mb-1 pl-1">{label}</label>}

      <Controller
        name={name || "content"}
        control={control}
        render={({ field: { onChange } }) => (
          <Editor apiKey="wo5zpf8gna68zyp4cskhykdw08i83mdxm497ryns97rlbtr5"
            initialValue=""
            init={{
              branding: false,
              height: 500,
              menubar: true,
              promotion:false,
              plugins: [
                "advlist autolink lists link image charmap print preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste code help wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic backcolor | \
        alignleft aligncenter alignright alignjustify | \
        bullist numlist outdent indent | removeformat | help ",
        content_style:"body { font-family:Helvetica,Arial,sans-sarif;font-size:14px}"
            }}
            onEditorChange={onChange}
          />
        )}
      />

      
    </div>
  );
};

export default RTE;
